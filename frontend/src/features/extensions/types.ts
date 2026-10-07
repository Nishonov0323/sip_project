export interface Extension {
  id: number
  number: string
  display_name: string
  created_at: string
}

export interface ExtensionCreate {
  number: string
  display_name: string
}
