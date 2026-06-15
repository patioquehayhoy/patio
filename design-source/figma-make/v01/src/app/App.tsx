import { PhoneFrame } from "./components/PhoneFrame";
import { FoodieMap } from "./components/FoodieMap";
import { FoodieDetail } from "./components/FoodieDetail";
import { FonderoPublish } from "./components/FonderoPublish";
import { FoodieEmpty } from "./components/FoodieEmpty";
import { FonderoMagicLink } from "./components/FonderoMagicLink";
import { FoodieSoldOut } from "./components/FoodieSoldOut";
import { SpecSheet } from "./components/SpecSheet";
import { FonderoHistory } from "./components/FonderoHistory";
import { InteractivePrototype } from "./components/InteractivePrototype";
import { FonderoPrototype } from "./components/FonderoPrototype";
import { TokenExport } from "./components/TokenExport";
import { RandomImage, PATIO_IMAGES } from "./components/RandomImage";
import { FoodieOnboarding } from "./components/FoodieOnboarding";
import { FoodieSaved } from "./components/FoodieSaved";
import { BrandMoments } from "./components/BrandMoments";
import { FonderoLanding } from "./components/FonderoLanding";
import {
  ErrorNoInternet,
  ErrorLocationDenied,
  ErrorMagicExpired,
} from "./components/ErrorStates";
import { FoodieMe } from "./components/FoodieMe";
import { FonderoFonda } from "./components/FonderoFonda";
import { FoodieLoading } from "./components/FoodieLoading";
import { MagicLinkEmail } from "./components/MagicLinkEmail";
import { FoodieMapDark } from "./components/FoodieMapDark";
import { FoodieDetailDark } from "./components/FoodieDetailDark";
import { LightDarkComparator } from "./components/LightDarkComparator";
import { AppStoreShots } from "./components/AppStoreShots";
import { IOSWidgets } from "./components/iOSWidgets";
import { MotionPrinciples } from "./components/MotionPrinciples";
import { PushPrompt } from "./components/PushPrompt";
import { FoodieReview } from "./components/FoodieReview";
import { FoodieSearch } from "./components/FoodieSearch";

const SF_DISPLAY = "'SF Pro Display', -apple-system, system-ui, sans-serif";
const SF_TEXT = "'SF Pro Text', -apple-system, system-ui, sans-serif";

export default function App() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(ellipse at top, #FBE7DD 0%, #F8F8F5 35%, #EFEFE9 100%)",
        padding: "80px 60px 100px",
      }}
    >
      {/* Botanical band — Patio Tahoe imagery */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto 56px",
          height: 220,
          borderRadius: 28,
          background: "#111214",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 4,
          padding: 4,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 22,
              background: "#0a0b0d",
            }}
          >
            <RandomImage
              rotate
              intervalMs={4500 + i * 700}
              seed={i * 2}
              objectPosition="center 30%"
              overlay="linear-gradient(180deg, rgba(17,18,20,0) 50%, rgba(17,18,20,0.4) 100%)"
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ maxWidth: 1400, margin: "0 auto 64px" }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#F2612F",
            }}
          />
          <span
            style={{
              fontFamily: SF_TEXT,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#F2612F",
            }}
          >
            Patio · Línea Tahoe
          </span>
        </div>
        <h1
          style={{
            fontFamily: SF_DISPLAY,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.95,
            color: "#111214",
            marginBottom: 16,
            maxWidth: 900,
          }}
        >
          ¿Qué hay hoy de comer?
        </h1>
        <p
          style={{
            fontFamily: SF_TEXT,
            fontSize: 19,
            color: "#4A4A47",
            maxWidth: 640,
            lineHeight: 1.45,
            letterSpacing: "-0.005em",
          }}
        >
          Tres pantallas clave del sistema: el descubrimiento heroico para Foodie,
          la ficha editorial del menú del día y la publicación premium para Fondero.
        </p>
      </div>

      {/* Screens */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(390px, 1fr))",
          gap: 48,
          justifyItems: "center",
        }}
      >
        <PhoneFrame label="Foodie · Mapa" caption="Descubrimiento + ficha del día">
          <FoodieMap />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Detalle" caption="Menú como contenido editorial">
          <FoodieDetail />
        </PhoneFrame>
        <PhoneFrame label="Fondero · Publicar" caption="30 segundos, modo operativo">
          <FonderoPublish />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Nocturno" caption="Fonditas cerradas">
          <FoodieEmpty />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Agotado" caption="Se acabó hoy">
          <FoodieSoldOut />
        </PhoneFrame>
        <PhoneFrame label="Fondero · Magic link" caption="Onboarding sin contraseña">
          <FonderoMagicLink />
        </PhoneFrame>
        <PhoneFrame label="Fondero · Historial" caption="Repetir menús, métricas suaves">
          <FonderoHistory />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Onboarding" caption="3 slides · permisos al final">
          <FoodieOnboarding />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Guardados" caption="Tab + estado abierto/cerrado">
          <FoodieSaved />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Yo" caption="Cuenta · stats · ajustes">
          <FoodieMe />
        </PhoneFrame>
        <PhoneFrame label="Fondero · Fonda" caption="Perfil + racha de publicación">
          <FonderoFonda />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Cargando" caption="Skeleton + pin pulse">
          <FoodieLoading />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Mapa nocturno" caption="Cenas · al pastor" tone="dark">
          <FoodieMapDark />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Detalle nocturno" caption="Trompo en vivo" tone="dark">
          <FoodieDetailDark />
        </PhoneFrame>
        <PhoneFrame label="Permisos · Push" caption="Onboarding · iOS nativo" tone="dark">
          <PushPrompt />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Buscar" caption="Resultados por antojo">
          <FoodieSearch />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Sin resultados" caption="Empty con sugerencias">
          <FoodieSearch empty />
        </PhoneFrame>
        <PhoneFrame label="Foodie · Reseña" caption="Cierra el loop">
          <FoodieReview />
        </PhoneFrame>
        <PhoneFrame label="Error · Sin internet" caption="Estado de red">
          <ErrorNoInternet />
        </PhoneFrame>
        <PhoneFrame label="Error · Ubicación" caption="Permiso denegado">
          <ErrorLocationDenied />
        </PhoneFrame>
        <PhoneFrame label="Error · Magic link" caption="Caducó · pedir otro" tone="dark">
          <ErrorMagicExpired />
        </PhoneFrame>
      </div>

      {/* Magic link email */}
      <div style={{ maxWidth: 1400, margin: "120px auto 0" }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'SF Pro Text', system-ui",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#F2612F",
              marginBottom: 12,
            }}
          >
            Correo · Magic link
          </div>
          <h2
            style={{
              fontFamily: "'SF Pro Display', system-ui",
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              color: "#111214",
            }}
          >
            El correo que recibe Lupita.
          </h2>
        </div>
        <MagicLinkEmail />
      </div>

      <LightDarkComparator />

      <InteractivePrototype />

      <FonderoPrototype />

      <BrandMoments />

      <IOSWidgets />

      <AppStoreShots />

      <FonderoLanding />

      <MotionPrinciples />

      <SpecSheet />

      <TokenExport />

      <div
        style={{
          maxWidth: 1400,
          margin: "80px auto 0",
          padding: "32px 36px",
          borderRadius: 28,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.8)",
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8A8A85",
              marginBottom: 8,
            }}
          >
            Paleta
          </div>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#111214",
            }}
          >
            Cerrada · sin amarillo
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Swatch hex="#F8F8F5" name="bg light" />
          <Swatch hex="#111214" name="ink" dark />
          <Swatch hex="#F2612F" name="accent" dark />
          <Swatch hex="#FBE7DD" name="accent soft" />
          <Swatch hex="#EFEFE9" name="surface" />
          <Swatch hex="#FF6A3D" name="accent dark" dark />
        </div>
        <div>
          <div
            style={{
              fontFamily: SF_TEXT,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8A8A85",
              marginBottom: 8,
            }}
          >
            Tipografía
          </div>
          <div
            style={{
              fontFamily: SF_DISPLAY,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#111214",
            }}
          >
            SF Pro · 800 ↔ 400
          </div>
        </div>
      </div>
    </div>
  );
}

function Swatch({ hex, name, dark }: { hex: string; name: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: hex,
          border: "1px solid rgba(17,18,20,0.08)",
          boxShadow: "0 4px 12px -4px rgba(17,18,20,0.1)",
        }}
      />
      <div style={{ fontFamily: SF_TEXT, fontSize: 10.5, color: "#8A8A85", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {name}
      </div>
      <div style={{ fontFamily: SF_TEXT, fontSize: 11, color: "#111214", fontWeight: 600 }}>
        {hex}
      </div>
    </div>
  );
}
