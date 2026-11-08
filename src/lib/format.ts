const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatShortDate = (d: Date) => shortDateFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);
export const formatRange = (a: Date, b: Date) => `${shortDateFmt.format(a)} → ${dateFmt.format(b)}`;

/** Pour pré-remplir un <input type="date"> */
export const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
/** Pour pré-remplir un <input type="datetime-local"> (heure locale) */
export const toDateTimeInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
