
import geopandas as gpd
from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.types import Text, Integer, DOUBLE_PRECISION, BIGINT, DateTime, Boolean
import pandas as pd
import numpy as np
from datetime import datetime
import warnings

class PostgresSaver:
    def __init__(self, db_url):
        self.engine = create_engine(
            db_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={
                "application_name": "wfs_data_loader",
                "options": "-c synchronous_commit=off"
            }
        )
        
    def create_metadata_table(self):
        """
        Create metadata table to track database updates (unified schema)
        """
        with self.engine.begin() as conn:
            # First, check if old schema exists and migrate if needed
            try:
                # Check if table exists with old schema
                old_schema_check = conn.execute(text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = 'database_metadata' AND column_name = 'total_rows'
                """)).fetchone()
                
                if old_schema_check:
                    print("Migrating old metadata table schema...")
                    # Drop old table and recreate with new schema
                    conn.execute(text("DROP TABLE IF EXISTS database_metadata"))
            except:
                pass
            
            # Create table with new unified schema
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS database_metadata (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT NOT NULL,
                    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    update_type TEXT DEFAULT 'data_refresh',
                    records_count BIGINT,
                    source_info TEXT,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(table_name, update_type)
                );
            """))
            
            # Create an index for faster queries
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_database_metadata_table_updated 
                ON database_metadata(table_name, last_updated DESC);
            """))
            print("Metadata table created/verified with unified schema")
    
    def update_metadata(self, table_name: str, rows_added: int = None, update_notes: str = None, 
                       records_count: int = None, source_info: str = None, notes: str = None, 
                       update_type: str = 'data_refresh'):
        """
        Update metadata after data insertion (unified method supporting both old and new calling patterns)
        """
        try:
            with self.engine.begin() as conn:
                # Handle both old and new calling patterns
                if records_count is None:
                    # Get current total row count, but handle case where table doesn't exist
                    try:
                        records_count = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                    except:
                        records_count = 0
                
                # Use the appropriate notes field
                final_notes = notes or update_notes
                if rows_added is not None and final_notes is None:
                    final_notes = f"Added {rows_added} new records"
                
                # Insert or update metadata using new schema
                conn.execute(text("""
                    INSERT INTO database_metadata 
                    (table_name, last_updated, update_type, records_count, source_info, notes)
                    VALUES (:table_name, CURRENT_TIMESTAMP, :update_type, :records_count, :source_info, :notes)
                    ON CONFLICT (table_name, update_type) 
                    DO UPDATE SET 
                        last_updated = CURRENT_TIMESTAMP,
                        records_count = EXCLUDED.records_count,
                        source_info = EXCLUDED.source_info,
                        notes = EXCLUDED.notes;
                """), {
                    "table_name": table_name,
                    "update_type": update_type,
                    "records_count": records_count,
                    "source_info": source_info,
                    "notes": final_notes
                })
                
                print(f"Metadata updated for table '{table_name}': {records_count} total rows")
                
        except Exception as e:
            print(f"Error updating metadata: {e}")
    
    def get_metadata(self, table_name: str = None):
        """
        Get metadata for a specific table or all tables
        """
        try:
            with self.engine.connect() as conn:
                if table_name:
                    result = conn.execute(text("""
                        SELECT * FROM database_metadata WHERE table_name = :table_name
                    """), {"table_name": table_name}).fetchone()
                    return dict(result) if result else None
                else:
                    result = conn.execute(text("""
                        SELECT * FROM database_metadata ORDER BY last_updated DESC
                    """)).fetchall()
                    return [dict(row) for row in result]
        except Exception as e:
            print(f"Error getting metadata: {e}")
            return None
        
        # Initialize metadata tracking table
        self._ensure_metadata_table()

    def _ensure_metadata_table(self):
        """
        Create metadata table to track database updates
        """
        with self.engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS database_metadata (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT NOT NULL,
                    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    update_type TEXT DEFAULT 'data_refresh',
                    records_count BIGINT,
                    source_info TEXT,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(table_name, update_type)
                );
            """))
            
            # Create an index for faster queries
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_database_metadata_table_updated 
                ON database_metadata(table_name, last_updated DESC);
            """))

    def get_last_update_info(self, table_name: str = None):
        """
        Get information about when the database was last updated
        """
        with self.engine.connect() as conn:
            if table_name:
                # Get info for specific table
                result = conn.execute(text("""
                    SELECT table_name, last_updated, update_type, records_count, source_info, notes
                    FROM database_metadata 
                    WHERE table_name = :table_name
                    ORDER BY last_updated DESC
                """), {'table_name': table_name}).fetchall()
            else:
                # Get info for all tables
                result = conn.execute(text("""
                    SELECT table_name, last_updated, update_type, records_count, source_info, notes
                    FROM database_metadata 
                    ORDER BY table_name, last_updated DESC
                """)).fetchall()
            
            return [dict(row._mapping) for row in result]

    def get_database_summary(self):
        """
        Get a summary of all tables and their last update times
        """
        with self.engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    dm.table_name,
                    dm.last_updated,
                    dm.records_count,
                    dm.source_info,
                    CASE 
                        WHEN dm.last_updated > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'very_recent'
                        WHEN dm.last_updated > CURRENT_TIMESTAMP - INTERVAL '1 week' THEN 'recent'
                        WHEN dm.last_updated > CURRENT_TIMESTAMP - INTERVAL '1 month' THEN 'somewhat_recent'
                        ELSE 'old'
                    END as freshness
                FROM database_metadata dm
                WHERE dm.update_type = 'data_refresh'
                ORDER BY dm.last_updated DESC
            """)).fetchall()
            
            return [dict(row._mapping) for row in result]

    def get_dtype_mapping_with_fallback(self, gdf: gpd.GeoDataFrame):
        """
        Use predefined dtype mapping for known columns, fallback to Text for new columns
        """
        # Your original predefined dtype mapping
        predefined_dtype_mapping = { 
            'id': BIGINT, 
            'gml_id': Text,
            'numer_szeregu': Text,
            'numer_zdjecia': Text,
            'rok_wykonania': Integer, 
            'data_nalotu': Text,
            'charakterystyka_przestrzenna': DOUBLE_PRECISION, 
            'kolor': Text,
            'karta_pracy': Text,
            'numer_zgloszenia': Text,
            'zrodlo_danych': Text,
            'url_do_pobrania': Text,
            'dt_pzgik': Text,
            'uid': Text 
        }
        
        # Add any additional types that were added via add_predefined_types()
        if hasattr(self, '_additional_types'):
            predefined_dtype_mapping.update(self._additional_types)
        
        final_dtype_mapping = {}
        
        # Process each column in the GeoDataFrame
        for column in gdf.columns:
            if column == 'geometry':
                continue
                
            if column in predefined_dtype_mapping:
                # Use predefined type
                final_dtype_mapping[column] = predefined_dtype_mapping[column]
                print(f"  {column}: {predefined_dtype_mapping[column]} (predefined)")
            else:
                # New column - fallback to Text
                final_dtype_mapping[column] = Text
                print(f"  {column}: Text (new column, fallback)")
        
        return final_dtype_mapping

    def mark_update_complete(self, table_name: str, total_records: int = None, 
                           source_info: str = None, notes: str = None):
        """
        Mark a complete update cycle as finished
        """
        if total_records is None:
            with self.engine.connect() as conn:
                try:
                    total_records = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
                except:
                    total_records = 0
        
        self.update_metadata(
            table_name=table_name,
            records_count=total_records,
            source_info=source_info or "Complete WFS data refresh",
            notes=notes or f"Full update completed with {total_records} total records",
            update_type='full_refresh'
        )
        
        print(f"Marked complete update for '{table_name}' - {total_records} total records")

    def clean_and_prepare_data(self, gdf: gpd.GeoDataFrame):
        """
        Clean and prepare data for database insertion
        """
        gdf_clean = gdf.copy()
        
        # Replace problematic values
        for column in gdf_clean.columns:
            if column == 'geometry':
                continue
                
            # Replace inf/-inf with NaN
            if pd.api.types.is_numeric_dtype(gdf_clean[column]):
                gdf_clean[column] = gdf_clean[column].replace([np.inf, -np.inf], np.nan)
            
            # Clean string columns
            elif pd.api.types.is_object_dtype(gdf_clean[column]):
                # Replace empty strings with None
                gdf_clean[column] = gdf_clean[column].replace('', None)
                # Strip whitespace
                gdf_clean[column] = gdf_clean[column].astype(str).str.strip()
                # Replace 'nan' strings with None
                gdf_clean[column] = gdf_clean[column].replace(['nan', 'None', 'NULL'], None)
        
        return gdf_clean

    def add_predefined_types(self, new_types: dict):
        """
        Add new predefined column types to the mapping
        Usage: saver.add_predefined_types({'new_column': Text, 'another_column': Integer})
        """
        if not hasattr(self, '_additional_types'):
            self._additional_types = {}
        self._additional_types.update(new_types)
        print(f"Added predefined types: {new_types}")

    def append_unique_chunk_sql(self, gdf_chunk: gpd.GeoDataFrame, table_name: str):
        """
        Enhanced method that uses predefined types for known columns and Text fallback for new columns
        """
        # Clean and prepare the data
        gdf_chunk = self.clean_and_prepare_data(gdf_chunk)
        
        # Get max ID for auto-increment
        with self.engine.connect() as conn:
            try:
                max_id = conn.execute(text(f"SELECT COALESCE(MAX(id),0) FROM {table_name}")).scalar()
            except:
                # Table might not exist yet, start from 0
                max_id = 0
                
        gdf_chunk = gdf_chunk.reset_index(drop=True)
        
        # Add ID column if it doesn't exist
        if 'id' not in gdf_chunk.columns:
            gdf_chunk['id'] = range(max_id + 1, max_id + 1 + len(gdf_chunk))
        
        # Use predefined types with Text fallback for new columns
        dtype_mapping = self.get_dtype_mapping_with_fallback(gdf_chunk)
        
        print(f"Column type mapping:")
        
        # Filter dtype mapping to only include columns present in the dataframe
        dtype = {col: dtype_mapping[col] for col in gdf_chunk.columns if col in dtype_mapping}

        temp_table = f"{table_name}_tmp"
        
        try:
            # Save to temporary table with predefined/fallback dtypes
            gdf_chunk.to_postgis(temp_table, self.engine, if_exists="replace", index=False, dtype=dtype)

            with self.engine.begin() as conn:
                total_records = len(gdf_chunk)
                
                # Get all columns except geometry
                columns = [col for col in gdf_chunk.columns if col != 'geometry']
                columns_str = ", ".join(columns)
                
                # Create the main table if it doesn't exist
                conn.execute(text(f"""
                    CREATE TABLE IF NOT EXISTS {table_name} (LIKE {temp_table} INCLUDING ALL)
                """))
                
                # Ensure unique constraint on uid exists if uid column is present
                if 'uid' in columns:
                    # Check if unique constraint already exists
                    constraint_exists = conn.execute(text(f"""
                        SELECT 1 FROM pg_constraint pc
                        JOIN pg_class pt ON pc.conrelid = pt.oid
                        WHERE pt.relname = '{table_name}' 
                        AND pc.conname = '{table_name}_uid_unique'
                        AND pc.contype = 'u'
                    """)).fetchone()
                    
                    if not constraint_exists:
                        # Add unique constraint on uid
                        conn.execute(text(f"""
                            ALTER TABLE {table_name} ADD CONSTRAINT {table_name}_uid_unique UNIQUE(uid);
                        """))
                        print(f"Added unique constraint on uid for table {table_name}")
                
                # Insert data with conflict handling
                if 'uid' in columns:
                    # Use uid for conflict resolution if available
                    result = conn.execute(text(f"""
                        INSERT INTO {table_name} ({columns_str}, geometry)
                        SELECT {columns_str}, geometry
                        FROM {temp_table}
                        ON CONFLICT (uid) DO NOTHING;
                    """))
                else:
                    # Fallback to insert without conflict handling
                    result = conn.execute(text(f"""
                        INSERT INTO {table_name} ({columns_str}, geometry)
                        SELECT {columns_str}, geometry
                        FROM {temp_table};
                    """))
                
                inserted_records = result.rowcount
                duplicate_records = total_records - inserted_records
                
                if duplicate_records > 0:
                    print(f"Skipping {duplicate_records} duplicate records from chunk for layer '{table_name}' (inserted {inserted_records} new records)")
                else:
                    print(f"Inserted {inserted_records} new records into '{table_name}'")
                
                # Clean up temporary table
                conn.execute(text(f"DROP TABLE IF EXISTS {temp_table}"))
                
                # Return the number of inserted records for metadata tracking
                return inserted_records
                
        except Exception as e:
            print(f"Error in append_unique_chunk_sql: {e}")
            # Clean up temporary table in case of error
            with self.engine.begin() as conn:
                conn.execute(text(f"DROP TABLE IF EXISTS {temp_table}"))
            raise
