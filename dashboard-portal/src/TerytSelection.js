import React, { useEffect, useState } from "react";
import "./TerytSelection.css";
import Select from 'react-select';
import Button from '@mui/material/Button';
import { colors } from "./theme/colors";

function TerytSelection({ onConfirm, style}) {
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

  const selectStyles = {
    container: (base) => ({
      ...base,
      width: "100%",
    }),
    control: (base) => ({
      ...base,
      borderColor: "#999",
      boxShadow: "none",
      minHeight: "30px",
      height: "30px",
      fontSize: "12px",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "30px",
      padding: "0 8px",
    }),
    input: (base) => ({
      ...base,
      margin: "0px",
      padding: "0px",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "30px",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      fontSize: "12px",
      margin: 0,
    }),
    menuList: (base) => ({
      ...base,
      paddingTop: 0,
      paddingBottom: 0,
      maxHeight: '180px',
      overflowY: 'auto', 
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? colors.secondary
        : state.isFocused
        ? "#eee"
        : "white",
      color: "black",
      fontSize: "12px",
      padding: "6px 10px",
      margin: 0,
    }),
  };

 return (
    <div className="teryt-selection" style={style}>
      {!isVisible ? (
        <button className="button-teryt" onClick={() => setIsVisible(true)}><img className="button-icon" src="/images/teryt2.png"alt="Filtruj po jednostce terytorialnej"></img></button>
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
                styles={selectStyles}
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
                styles={selectStyles}
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
                styles={selectStyles}
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
            <Button
              className="button-control"
              variant="outlined"
              disabled={!selectedWoj}
              onClick={() => {
                if (selectedGmi) onConfirm("gmi", selectedGmi.value);
                else if (selectedPow) onConfirm("pow", selectedPow.value);
                else onConfirm("woj", selectedWoj.value);
                setTimeout(() => setIsVisible(false), 300); 
              }}
            >
              Zatwierdź
            </Button>

            <Button
              variant="outlined"
              className="button-control"
              onClick={() => {
                setSelectedWoj("");
                setSelectedPow("");
                setSelectedGmi("");
                onConfirm(null, null);
                setTimeout(() => setIsVisible(false), 300); 
              }}
            >
              Wyczyść filtr
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TerytSelection;
