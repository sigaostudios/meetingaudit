import { WEEKDAYS, type Weekday } from "@/types/report"

export type RecurrenceCadence = "Weekly" | "Biweekly" | "Monthly"

export type RecurrenceModel = {
  weekdays: Weekday[]
  cadence: RecurrenceCadence
}

export function parseRecurrence(frequency: string): RecurrenceModel {
  const parts = frequency
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)

  const weekdays = parts.filter((part): part is Weekday =>
    (WEEKDAYS as readonly string[]).includes(part)
  )

  const cadence: RecurrenceCadence = parts.includes("Biweekly")
    ? "Biweekly"
    : parts.includes("Monthly")
      ? "Monthly"
      : "Weekly"

  return {
    weekdays,
    cadence,
  }
}

export function formatRecurrence(model: RecurrenceModel) {
  const weekdayPart = model.weekdays.join("; ")
  return weekdayPart ? `${weekdayPart}; ${model.cadence}` : model.cadence
}

export function parseDurationMinutes(duration: string) {
  const match = duration.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 30
}

export function formatDurationMinutes(minutes: number) {
  return `${Math.max(1, Math.round(minutes))} minutes`
}

export function parseTimeToMinutes(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) {
    return 9 * 60
  }

  let hour = Number.parseInt(match[1], 10) % 12
  const minute = Number.parseInt(match[2], 10)
  if (match[3].toUpperCase() === "PM") {
    hour += 12
  }

  return hour * 60 + minute
}

export function formatMinutesToTime(totalMinutes: number) {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)))
  const hour24 = Math.floor(bounded / 60)
  const minute = bounded % 60
  const meridiem = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

  return `${hour12}:${minute.toString().padStart(2, "0")} ${meridiem}`
}
