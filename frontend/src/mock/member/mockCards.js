export const mockCards = [
  {
    cardNumber: "7081239456789012",
    dni: "71234567",
  },
  {
    cardNumber: "123456",
    dni: "70123456",
  },
  {
    cardNumber: "5890000011112222",
    dni: "73456789",
  },
  {
    cardNumber: "5890999988887777",
    dni: "74567890",
  },
];

export function findCardByNumber(cardNumber) {
  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  return mockCards.find((card) => card.cardNumber === cleanCardNumber);
}
