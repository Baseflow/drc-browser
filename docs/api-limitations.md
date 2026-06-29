# DRC Browser — API Limitations

This document lists known limitations of the Documenten API v1.5.0 that affect the DRC Browser.
Some may be solvable at the application level; others are fundamental API constraints.

It might be valuable to make improvements to the Documenten API to handle some of these.

---

## Sorting

Only 7 fields support ordering via the `ordering` query parameter (as defined in the Maykin OAS spec):

| Column            | API field                     |
|-------------------|-------------------------------|
| Titel             | `titel`                       |
| Auteur            | `auteur`                      |
| Aangemaakt        | `creatiedatum`                |
| Grootte           | `bestandsomvang`              |
| Formaat           | `formaat`                     |
| Status            | `status`                      |
| Vertrouwelijkheid | `vertrouwelijkheidaanduiding` |

Fields that are **not** sortable: identificatie, bronorganisatie, begin registratie, ontvangstdatum, verzenddatum, taal, versie, gebruiksrecht, informatieobjecttype, vergrendeld, beschrijving.

---

## Filtering — unknown indexing

The API accepts a number of filter parameters, but there is no indication in the spec of which fields are database-indexed. Filtering on `beschrijving` or `auteur` may result in full table scans on large datasets. Known filters and their likely index status:

| Filter                                    | Likely indexed               |
|-------------------------------------------|------------------------------|
| `bronorganisatie`                         | Yes (common lookup key)      |
| `identificatie`                           | Yes                          |
| `creatiedatum__gte` / `creatiedatum__lte` | Yes                          |
| `vertrouwelijkheidaanduiding`             | Likely                       |
| `informatieobjecttype`                    | Likely                       |
| `locked`                                  | Likely                       |
| `titel`                                   | Unknown                      |
| `auteur`                                  | Unknown                      |
| `beschrijving`                            | Unknown — likely not indexed |
| `bestandsnaam`                            | Unknown                      |
| `trefwoorden`                             | Unknown                      |
| `objectinformatieobjecten__object`        | Unknown (cross-table join)   |
| `objectinformatieobjecten__objectType`    | Unknown (cross-table join)   |

---

## Trefwoorden

There is no endpoint to retrieve available trefwoorden.
Users must know the values in advance or search by guessing.
A future improvement could be a dedicated `/trefwoorden` endpoint or an autocomplete based on an indexed distinct query.

---

## OIO — objectType filter not supported

The `/objectinformatieobjecten` endpoint only accepts `object` and `informatieobject` as filter parameters.
Filtering by `objectType` (zaak, besluit, overige) is **not supported** by the API, despite `objectType` being a field on the OIO resource.

Workaround: none at the API level. Client-side filtering after fetching all pages is possible but impractical for large datasets.

---

## EIO — no bulk operations

There is no bulk delete or bulk update endpoint. All operations are per-resource (one UUID at a time).

---

## EIO — no full-text search

There is no full-text or fuzzy search. All filter parameters are exact or prefix matches.
Searching for partial words within `beschrijving` or `titel` is only possible if the server implements `__icontains`-style lookups, which is not guaranteed.

---

## Pagination — no total count before first request

The total `count` is only available after the first paginated request. There is no lightweight HEAD or count-only endpoint.
NOTE: a lightweight count was actually added in de ZRC for the pagination endpoint, but this is not formalized in the DRC yet.

---

## Trefwoorden — array filter

The `trefwoorden` filter accepts a comma-separated string, but the exact matching behavior (AND vs OR, exact vs partial) is not specified in the OAS and may vary by implementation.

---

## EIO versioning — `inhoud` URL is version-ambiguous

The `inhoud` field on an EIO resource contains a download URL, but the spec does not define whether this URL is version-specific or always resolves to the latest content. When fetching an older version via `GET /enkelvoudiginformatieobjecten/{uuid}?versie=3`, the returned `inhoud` URL may still point to the latest binary rather than the binary at that version.

As a result, clients cannot safely use the `inhoud` URL to download a specific version. The DRC Browser works around this by constructing the download URL explicitly as `/enkelvoudiginformatieobjecten/{uuid}/download?versie={n}`, which the API does support. However, this means the `inhoud` field is effectively unusable for versioned downloads.

A cleaner API design would either:
- Make `inhoud` version-aware (URL changes per version), or
- Deprecate `inhoud` in favour of the `/download?versie=` endpoint and document it clearly in the OAS.
