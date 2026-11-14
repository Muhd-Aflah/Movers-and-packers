import { APP_CONFIG } from "../constants/config";

const contact = APP_CONFIG.contact;
const dialablePhone = typeof contact.phone === "string"
  ? contact.phone.replace(/[^+\d]/g, "")
  : "";
const hasDialablePhone = /^\+[1-9]\d{6,14}$/.test(dialablePhone);

export function PublicContactDetails({ className = "" }) {
  return (
    <address className={`space-y-2 not-italic ${className}`}>
      <p>
        <span className="font-semibold">Phone: </span>
        {hasDialablePhone
          ? <a className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current" href={`tel:${dialablePhone}`}>{contact.phone}</a>
          : <span>Phone contact is not configured.</span>}
      </p>
      {contact.email && <p><span className="font-semibold">Email: </span><a className="break-all underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
      {contact.address && <p><span className="font-semibold">Address: </span>{contact.address}</p>}
    </address>
  );
}
