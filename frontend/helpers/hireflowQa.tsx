const hiddenQaApplicationIds = new Set([
  "HF-1791113746685-VCCUJ",
  "HF-1791115381461-HNU6N",
  "HF-1791119075532-88WT4",
  "HF-1791121154449-KL6R3",
  "HF-1791132932397-QJDKV",
  "HF-1791174018047-FG5V0",
  "HF-1791209349420-JJLEW",
  "HF-1791298452832-TT1P2",
  "HF-1791298621282-3L4CW",
  "HF-1791298690677-DAHOK",
  "HF-1791118024699-9VAXO",
]);

export function isHiddenHireFlowQaApplication(applicationId?: string) {
  return Boolean(applicationId && hiddenQaApplicationIds.has(applicationId));
}
