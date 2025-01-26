export const openModal = (sampleKpi) => {
  return (
    {
      type: "UPDATE_MODAL",
      value: sampleKpi
    }
  )
}

export const closeModal = () => {
  return (
    {
      type: "CLOSE_MODAL",
      value: null
    }
  )
}