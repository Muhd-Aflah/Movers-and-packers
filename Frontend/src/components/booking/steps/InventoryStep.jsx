import { Box } from "lucide-react";
import { BookingField } from "../BookingField";
import { Input } from "../../ui/input";
import { INVENTORY_FIELDS, MATERIAL_FIELDS } from "../bookingContract";

function QuantityGroup({ title, fields, values, errors, onChange }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold text-slate-900 dark:text-white">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(([key, label]) => <BookingField key={key} id={`${title}-${key}`} label={label} required={false}>
          <Input id={`${title}-${key}`} type="number" min="0" max="10000" step="1" inputMode="numeric" value={values[key]} onChange={(event) => onChange(key, event.target.value)} aria-invalid={Boolean(errors)} aria-describedby={errors ? `${title}-error` : undefined} />
        </BookingField>)}
      </div>
      {errors && <p id={`${title}-error`} role="alert" className="text-sm text-red-700 dark:text-red-300">{errors}</p>}
    </fieldset>
  );
}

export function InventoryStep({ draft, update, errors }) {
  if (draft.serviceMode !== "full_service") return <div className="rounded-card border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"><div className="flex gap-3"><Box aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><div><h3 className="font-semibold">Inventory is not needed for transport only</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">We’ll quote vehicle transport without packing inventory or material quantities.</p></div></div></div>;

  const updateGroup = (group, key, value) => update({ [group]: { ...draft[group], [key]: value } });
  return (
    <div className="space-y-7">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Enter approximate item counts. Packing materials are a separate input; quantities are not inferred from your inventory.</p>
      {errors.inventory && <p role="alert" className="rounded-control bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{errors.inventory}</p>}
      {errors.materials && <p role="alert" className="rounded-control bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{errors.materials}</p>}
      <QuantityGroup title="Inventory items" fields={INVENTORY_FIELDS} values={draft.inventory} errors={null} onChange={(key, value) => updateGroup("inventory", key, value)} />
      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <QuantityGroup title="Packing materials" fields={MATERIAL_FIELDS} values={draft.materials} errors={null} onChange={(key, value) => updateGroup("materials", key, value)} />
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Material quantity keys and permitted range (0–10,000) follow the current pricing API. Missing material rates may require an admin estimate.</p>
      </div>
    </div>
  );
}
