import React from "react";
import { Container, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import "./footer.css";

function Footer() {
  return (
    <footer className="bg-light py-2 pt-4 mt-4">
      <Container>
        <Row className="justify-content-center">
          <Col xs="auto" className="mx-2">
            <a href="https://www.linkedin.com/in/laufer-daniel/" target="_blank">
              <FontAwesomeIcon icon={faLinkedin} size="2x" />
            </a>
          </Col>
          <Col xs="auto" className="mx-2">
            <a href="https://www.linkedin.com/in/laufer-daniel/" target="_blank">
              <FontAwesomeIcon icon={faInstagram} size="2x" />
            </a>
          </Col>
          <Col xs="auto" className="mx-2">
            <a href="https://www.linkedin.com/in/laufer-daniel/" target="_blank">
              <FontAwesomeIcon icon={faFacebook} size="2x" />
            </a>
          </Col>
        </Row>
        <Row className="justify-content-center">
          <Col xs="auto">
            <p className="text-center mt-3">&copy; Easy Chef {(new Date()).getFullYear()}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;