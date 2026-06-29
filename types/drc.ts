// SPDX-License-Identifier: EUPL-1.2
// Copyright (C) 2026 Gemeente Utrecht

export type AuthType = "zgw" | "token"

export interface ConnectionConfig {
  baseUrl: string
  authType: AuthType
  /** ZGW: client ID */
  clientId?: string
  /** ZGW: client secret */
  clientSecret?: string
  /** Bearer: raw token */
  token?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface EnkelvoudigInformatieObject {
  url: string
  identificatie: string
  bronorganisatie: string
  creatiedatum: string
  titel: string
  vertrouwelijkheidaanduiding: string
  auteur: string
  status: string
  formaat: string
  taal: string
  versie: number
  beginRegistratie: string
  bestandsnaam: string
  inhoud: string | null
  bestandsomvang: number
  link: string
  beschrijving: string
  ontvangstdatum: string | null
  verzenddatum: string | null
  indicatieGebruiksrecht: boolean | null
  ondertekening: {
    soort: string
    datum: string | null
  } | null
  integriteit: {
    algoritme: string
    waarde: string
    datum: string
  } | null
  informatieobjecttype: string
  locked: boolean
}

export interface ObjectInformatieObject {
  url: string
  informatieobject: string
  object: string
  objectType: string
}

export interface EioFilters {
  bronorganisatie?: string
  creatiedatum__gte?: string
  creatiedatum__lte?: string
  titel?: string
  beschrijving?: string
  identificatie?: string
  vertrouwelijkheidaanduiding?: string
  auteur?: string
  informatieobjecttype?: string
  bestandsnaam?: string
  trefwoorden?: string
  locked?: string
  objectinformatieobjecten__object?: string
  objectinformatieobjecten__objectType?: string
  ordering?: string
}

export interface OioFilters {
  informatieobject?: string
  object?: string
}
