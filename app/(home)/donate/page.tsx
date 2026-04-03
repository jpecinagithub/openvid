import { headers } from "next/headers";
import DonateClient from "./DonateClient";

export const DONATION_METHODS = [
  {
    id: "yape",
    name: "Yape",
    tagline: "Transferencia local",
    icon: "simple-icons:yape",
    image: "/images/pages/yape.avif",
    color: "#6C3EB8",
    detail: "Escanea el QR o usa el número de teléfono",
    phone: "+51 954 306 632",
    qrImage: "/images/pages/qr.avif",
  },
  {
    id: "visa",
    name: "Transferencia Bancaria",
    tagline: "Red nacional",
    icon: "mdi:bank-outline",
    image: "/images/pages/visa.avif",
    color: "#F5A623",
    detail: "Depósito directo a cuenta BCP (Soles)",
    account: "200-12083829-0-69",
    cci: "002-20011208382906945",
  },
  {
    id: "paypal",
    name: "PayPal",
    tagline: "Transferencia internacional",
    icon: "logos:paypal",
    color: "#009CDE",
    detail: "Envío mediante correo electrónico o enlace directo",
    email: "oliverachavezcristian@gmail.com",
    link: "https://www.paypal.com/ncp/payment/AZ3LS98LJ9SM2",
  },
];

export default async function DonatePage() {
  const headersList = await headers();
  const country = headersList.get("x-user-country") || "UNKNOWN";
  
  const isPeru = country === "PE" || country === "UNKNOWN";

  const availableMethods = isPeru 
    ? DONATION_METHODS 
    : DONATION_METHODS.filter(m => m.id !== "yape");

  const defaultMethod = isPeru ? "yape" : "paypal";

  return <DonateClient methods={availableMethods} defaultMethod={defaultMethod} />;
}