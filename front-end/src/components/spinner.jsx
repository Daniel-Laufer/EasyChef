import React from "react";
import Spinner from 'react-bootstrap/Spinner';
import "./spinner.css";

function CustomSpinner() {
  return (
    <Spinner className="custom-spinner" animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
  );
}

export default CustomSpinner;