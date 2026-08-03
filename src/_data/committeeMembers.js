function placeholder(type, constituencyNumber) {
  return {
    name: "Dr [Name]",
    constituency: `[Constituency ${constituencyNumber}]`,
    practice: "[Practice Name]",
    type,
  };
}

export default {
  partners: Array.from({ length: 16 }, (_, i) => placeholder("partner", i + 1)),
  salaried: Array.from({ length: 9 }, (_, i) => placeholder("salaried", i + 1)),
  freelance: Array.from({ length: 1 }, (_, i) => placeholder("freelance", i + 1)),
};
