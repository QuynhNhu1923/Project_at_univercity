export const helpInfoDashboard = () => {
  return (
    {
      type: 'HELP_INFO_DASHBOARD',
      open: true
    }
  )
}

export const helpSider = () => {
  return (
    {
      type: 'HELP_SIDER',
      open: true
    }
  )
}

export const helpSiderClose = () => {
  return (
    {
      type: 'HELP_SIDER_CLOSE',
      open: false
    }
  )
}


export const helpClose = () => {
  return (
    {
      type: "HELP_CLOSE",
      open: false
    }
  )
}