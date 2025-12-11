import React from "react";
import logo from "../../assets/logoJaesCargo.png";

interface Props {
  solicitud: any;
}

const PlantillaPDFSolicitud = React.forwardRef<HTMLDivElement, Props>(
  ({ solicitud }, ref) => {
    const safe = (v: any) => Number(v || 0);

    return (
      <div
        ref={ref}
        style={{
          width: "1050px",
          padding: "40px 50px",
          background: "white",
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: "#222",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <img src={logo} style={{ width: "210px" }} />

          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#8B0000" }}>
              SOLICITUD DE ENVÍO
            </h1>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
              Nº {solicitud.id}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
              Fecha: {solicitud.fecha}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "15px",
            padding: "20px",
            border: "2px solid #eee",
            borderRadius: "12px",
            background: "#fafafa",
          }}
        >
          {/* CLIENTE */}
          <div style={{ width: "48%" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#8B0000" }}>CLIENTE</h3>
            <p>
              <strong>Nombre:</strong> {solicitud.cliente_nombre}
            </p>
            <p>
              <strong>Código Casillero:</strong> {solicitud.codigoCasillero}
            </p>
          </div>

          <div style={{ width: "48%" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#8B0000" }}>
              DESTINATARIO
            </h3>
            <p>
              <strong>Nombre:</strong> {solicitud.destinatario_nombre}
            </p>
            <p>
              <strong>País/Ciudad:</strong> {solicitud.destinatario_ciudad}
            </p>
            <p>
              <strong>Dirección:</strong> {solicitud.destinatario_direccion}
            </p>
            <p>
              <strong>Teléfono:</strong> {solicitud.destinatario_telefono}
            </p>
          </div>
        </div>

        <h3 style={{ marginTop: "30px", color: "#8B0000" }}>
          DETALLE DE PAQUETES
        </h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            marginTop: "10px",
          }}
        >
          <thead>
            <tr style={{ background: "#8B0000", color: "white" }}>
              <th style={th}>Tracking</th>
              <th style={th}>HAWB</th>
              <th style={th}>Contenido</th>
              <th style={th}>Peso (lb)</th>
              <th style={th}>Asegurado (USD)</th>
            </tr>
          </thead>

          <tbody>
            {solicitud.paquetes?.map((p: any, i: number) => (
              <tr key={i}>
                <td style={td}>{p.tracking}</td>
                <td style={td}>{p.hawb}</td>
                <td style={td}>{p.contenido}</td>
                <td style={td}>{p.peso}</td>
                <td style={td}>{p.asegurado}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {solicitud.cargos && solicitud.cargos.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ marginTop: "30px", color: "#8B0000" }}>
              CARGOS ADICIONALES
            </h3>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
              }}
            >
              <thead>
                <tr style={{ background: "#8B0000", color: "white" }}>
                  <th style={th}>Cargo</th>
                  <th style={th}>Valor USD</th>
                  <th style={th}>Valor COP</th>
                </tr>
              </thead>

              <tbody>
                {solicitud.cargos?.map((c: any, i: number) => (
                  <tr key={i}>
                    <td style={td}>{c.tipo_cargo}</td>
                    <td style={td}>${safe(c.valor_usd).toFixed(2)}</td>
                    <td style={td}>
                      ${safe(c.valor_cop).toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "2px solid #eee",
            borderRadius: "12px",
            background: "#fafafa",
          }}
        >
          <h3 style={{ marginBottom: "10px", color: "#8B0000" }}>TOTALES</h3>

          <p>
            <strong>Seguro total (USD):</strong>{" "}
            ${safe(solicitud.seguroUSD).toFixed(2)}
          </p>
          <p>
            <strong>Flete (USD):</strong> $
            {safe(solicitud.fleteUSD).toFixed(2)}
          </p>
          <p>
            <strong>Total USD:</strong> $
            {safe(solicitud.totalUSD).toFixed(2)}
          </p>

          <p>
            <strong>TRM aplicada:</strong> {solicitud.trm}
          </p>

          <p>
            <strong>Total COP (sin cargos):</strong>{" "}
            {safe(solicitud.totalCOP).toLocaleString("es-CO")}
          </p>

          <p>
            <strong>Cargos adicionales (COP):</strong>{" "}
            {safe(solicitud.totalCargosCOP).toLocaleString("es-CO")}
          </p>

          <p
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            <strong>Total FINAL (COP):</strong>{" "}
            {safe(solicitud.totalCOPConCargos).toLocaleString("es-CO")}
          </p>
        </div>

        <div
          style={{
            marginTop: "30px",
            padding: "25px",
            borderRadius: "12px",
            background: "#fdfdfd",
            border: "2px solid #eee",
          }}
        >
          <h3 style={{ marginBottom: "12px", color: "#8B0000" }}>
            INFORMACIÓN BANCARIA
          </h3>

          <p>
            <strong>JAES CARGO INTERNACIONAL</strong>
          </p>
          <p>
            <strong>Davivienda</strong>
          </p>
          <p>
            <strong>Cuenta de Ahorros:</strong> 23700007197
          </p>
          <p>
            <strong>NIT:</strong> 901826561
          </p>
        </div>

        <div style={{ marginTop: "25px", textAlign: "center" }}>
          <a
            href="https://pagos.pse.com.co"
            target="_blank"
            style={{
              display: "inline-block",
              padding: "12px 25px",
              background: "#005BBF",
              color: "white",
              fontWeight: "bold",
              textDecoration: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              fontSize: "15px",
            }}
          >
            PAGAR EN LÍNEA (PSE)
          </a>

          <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
            Haz clic para completar tu pago de forma segura
          </p>
        </div>

        <div
          style={{
            marginTop: "35px",
            paddingTop: "15px",
            borderTop: "2px solid #ddd",
            textAlign: "center",
            fontSize: "12px",
            color: "#444",
          }}
        >
          <p>JAES CARGO INTERNACIONAL © {new Date().getFullYear()}</p>
          <p>
            www.jaescargo.com • comercial@jaescargo.com • Bogotá - Colombia
          </p>
        </div>
      </div>
    );
  }
);

const th = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left" as const,
  fontWeight: "bold",
};

const td = {
  padding: "10px",
  border: "1px solid #ddd",
};

export default PlantillaPDFSolicitud;
