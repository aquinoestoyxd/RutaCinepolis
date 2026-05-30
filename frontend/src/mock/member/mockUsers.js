export const mockUsers = [
  {
    dni: "71234567",
    name: "Diego Rodriguez",
    visits: 18,
    points: 2450,
    email: "diego@mail.com",
  },
  {
    dni: "70123456",
    name: "Carlos Ramirez",
    visits: 15,
    points: 1200,
    email: "carlos@mail.com",
  },
  {
    dni: "73456789",
    name: "Lucia Torres",
    visits: 4,
    points: 420,
    email: "lucia@mail.com",
  },
  {
    dni: "74567890",
    name: "Mariana Vega",
    visits: 31,
    points: 6200,
    email: "mariana@mail.com",
  },
];

export function findUserByDni(dni) {
  return mockUsers.find((user) => user.dni === dni);
}
