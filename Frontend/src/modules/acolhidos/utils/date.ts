export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

export const calculateAgeFromBrazilianDate = (date: string) => {
  const [day, month, year] = date.split('/').map(Number)
  const today = new Date()
  let age = today.getFullYear() - year

  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age--
  }

  return age
}
