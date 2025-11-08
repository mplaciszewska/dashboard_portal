import React, { useEffect, useState } from "react";
import "./TerytSelection.css";
import Select from 'react-select';
import sharedSelectStyles from '../theme/dropdown';
import { colors } from "../theme/colors";
import "../theme/Button.css";


function TerytSelection({ onConfirm }) {
  const [isVisible, setIsVisible] = useState(false);

  const [wojewodztwa, setWojewodztwa] = useState([]);
  const [powiaty, setPowiaty] = useState([]);
  const [gminy, setGminy] = useState([]);

  const [selectedWoj, setSelectedWoj] = useState("");
  const [selectedPow, setSelectedPow] = useState("");
  const [selectedGmi, setSelectedGmi] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/wojewodztwa")
      .then((res) => res.json())
      .then(setWojewodztwa);
  }, []);

  useEffect(() => {
    if (!selectedWoj) {
      setPowiaty([]);
      setSelectedPow("");
      return;
    }
    fetch(`http://localhost:8000/api/powiaty?woj_id=${selectedWoj?.value}`)
      .then((res) => res.json())
      .then((data) => {
        setPowiaty(data);
        setSelectedPow("");
        setGminy([]);
        setSelectedGmi("");
      });
  }, [selectedWoj]);

  useEffect(() => {
    if (!selectedPow) {
      setGminy([]);
      setSelectedGmi("");
      return;
    }
    fetch(`http://localhost:8000/api/gminy?powiat_id=${selectedPow?.value}`)
      .then((res) => res.json())
      .then((data) => {
        setGminy(data);
        setSelectedGmi("");
      });
  }, [selectedPow]);


 return (
    <div className="teryt-selection"
          style={{
            position: 'absolute',
            top: '115px',
            left: '8px',
            zIndex: 1000,
            borderRadius: '4px',
          }}>
      {!isVisible ? (
        <button className="button-icon" onClick={() => setIsVisible(true)}><img className="button-icon-img" src="/images/search.png"alt="Filtruj po jednostce terytorialnej"></img></button>
      ) : (
        <div className="teryt-form">
          <div className="teryt-selection-header">
            <h4>Wybierz jednostkę terytorialną</h4>
            <button className="button-close" onClick={() => setIsVisible(false)}>
              <img className="button-close" src="/images/close.png" alt="Zamknij"></img>
            </button>
          </div>

          <div className="teryt-selection-labels">
            <label>
              {/* <p>Województwo:</p> */}
              <Select
                value={selectedWoj}
                onChange={setSelectedWoj}
                options={wojewodztwa.map((w) => ({
                  value: w.id,
                  label: w.name,
                }))}
                placeholder="-- Województwo --"
                styles={sharedSelectStyles}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary25: "#eee",
                    primary: colors.secondary,
                    neutral20: "#999",
                    neutral30: "#666",
                    primary50: colors.secondary,
                  },
                })}
              />
            </label>

            <label>
              {/* <p>Powiat:</p> */}
              <Select
                value={selectedPow}
                onChange={setSelectedPow}
                options={powiaty.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                placeholder="-- Powiat --"
                styles={sharedSelectStyles}
                isDisabled={!powiaty.length}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary25: "#eee",
                    primary: colors.secondary,
                    neutral20: "#999",
                    neutral30: "#666",
                    primary50: colors.secondary,
                  },
                })}
              />
            </label>

            <label>
              {/* <p>Gmina:</p> */}
              <Select
                value={selectedGmi}
                onChange={setSelectedGmi}
                options={gminy.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
                placeholder="-- Gmina --"
                styles={sharedSelectStyles}
                isDisabled={!gminy.length}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary25: "#eee",
                    primary: colors.secondary,
                    neutral20: "#999",
                    neutral30: "#666",
                    primary50: colors.secondary,
                  },
                })}
              />
            </label>
          </div>
          <div className="buttons-control">
            <button
              className="button-control"
              disabled={!selectedWoj}
              style={{
                backgroundColor: colors.secondaryOpaque,
              }}
              onClick={() => {
                if (selectedGmi) onConfirm("gmi", selectedGmi.value);
                else if (selectedPow) onConfirm("pow", selectedPow.value);
                else onConfirm("woj", selectedWoj.value);
                setTimeout(() => setIsVisible(false), 300); 
              }}
            >
              Zatwierdź
            </button>

            <button
              className="button-control"
              style={{
                backgroundColor: colors.secondaryOpaque,
              }}
              onClick={() => {
                setSelectedWoj("");
                setSelectedPow("");
                setSelectedGmi("");
                onConfirm(null, null);
                setTimeout(() => setIsVisible(false), 300); 
              }}
            >
              Wyczyść filtr
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TerytSelection;
