export interface Extension {
  id: number
  number: string
  display_name: string
  password: string
  online: boolean
  created_at: string
}

export interface ExtensionCreate {
  number: string
  display_name: string
}
