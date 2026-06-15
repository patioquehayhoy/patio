import { PatioMark } from "./PatioMark";
import { ArrowRight } from "lucide-react";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export function MagicLinkEmail() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        borderRadius: 22,
        overflow: "hidden",
        background: "#FFFFFF",
        border: "1px solid rgba(17,18,20,0.06)",
        boxShadow: "0 20px 50px -20px rgba(17,18,20,0.18)",
      }}
    >
      {/* gmail-ish header */}
      <div
        style={{
          padding: "14px 22px",
          background: "#F8F8F5",
          borderBottom: "1px solid rgba(17,18,20,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: "#111214",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F8F8F5",
            fontFamily: SF_DISPLAY,
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          P
        </div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 13,
              fontWeight: 600,
              color: "#111214",
              letterSpacing: "-0.005em",
            }}
          >
            Patio · hola@patio.mx
          </div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              color: "#8A8A85",
              marginTop: 1,
            }}
          >
            para lupita@fondaroma.mx · hoy 13:00
          </div>
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 8,
            background: "#FBE7DD",
            fontFamily: SF_TEXT,
            fontSize: 11,
            fontWeight: 600,
            color: "#F2612F",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Bandeja
        </div>
      </div>

      {/* subject */}
      <div
        style={{
          padding: "24px 32px 0",
        }}
      >
        <div
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "#111214",
            lineHeight: 1.2,
          }}
        >
          Tu enlace para entrar a Patio
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "24px 32px 28px" }}>
        <div className="flex items-center gap-2 mb-6">
          <PatioMark size={36} />
          <span
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#111214",
            }}
          >
            Patio
          </span>
        </div>

        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#111214",
            lineHeight: 1.55,
            marginBottom: 14,
            letterSpacing: "-0.005em",
          }}
        >
          Hola Lupita,
        </p>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 16,
            color: "#4A4A47",
            lineHeight: 1.55,
            marginBottom: 28,
            letterSpacing: "-0.005em",
          }}
        >
          Pediste un enlace para entrar a tu cuenta de Patio y publicar el
          menú de hoy. Toca el botón de abajo — válido los próximos
          15 minutos.
        </p>

        {/* button */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 28px",
            borderRadius: 14,
            background: "#F2612F",
            color: "#fff",
            fontFamily: SF_TEXT,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.005em",
            boxShadow: "0 10px 24px -8px rgba(242,97,47,0.4)",
            marginBottom: 22,
          }}
        >
          Entrar a Patio
          <ArrowRight size={16} strokeWidth={2.4} />
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "#F8F8F5",
            border: "1px solid rgba(17,18,20,0.06)",
            fontFamily: "'SF Mono', monospace",
            fontSize: 11.5,
            color: "#8A8A85",
            wordBreak: "break-all",
            letterSpacing: "-0.005em",
            marginBottom: 28,
          }}
        >
          patio.mx/m/k3f9a8c2-7e1d-4b5a-9c8f-2d7e6a1b3c4d
        </div>

        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 13,
            color: "#8A8A85",
            lineHeight: 1.55,
            letterSpacing: "-0.005em",
            paddingTop: 20,
            borderTop: "1px solid rgba(17,18,20,0.06)",
          }}
        >
          ¿No fuiste tú? Ignora este correo, nadie podrá entrar sin abrirlo
          desde tu bandeja. ¿Dudas? Escríbenos a hola@patio.mx.
        </p>
      </div>

      {/* footer */}
      <div
        style={{
          padding: "18px 32px",
          background: "#F8F8F5",
          borderTop: "1px solid rgba(17,18,20,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: SF_TEXT,
          fontSize: 11,
          color: "#8A8A85",
          letterSpacing: "-0.005em",
        }}
      >
        <div className="flex items-center gap-1.5">
          <PatioMark size={14} monochrome tone="ink" />
          Patio · CDMX
        </div>
        <span>Te llegó este correo porque pediste entrar.</span>
      </div>
    </div>
  );
}
