delete from dragon_statue_source_metadata
using source_records, catalog_sources
where dragon_statue_source_metadata.source_record_id = source_records.id
  and source_records.catalog_source_id = catalog_sources.id
  and catalog_sources.name = 'User-supplied Archero workbooks'
  and source_records.external_key = 'workbook:Archero - Dragon Statues.xlsx:sheet:Lookup:row:2'
  and source_records.entity_type = 'dragon_statue_source_metadata';

delete from source_records
using catalog_sources
where source_records.catalog_source_id = catalog_sources.id
  and catalog_sources.name = 'User-supplied Archero workbooks'
  and source_records.external_key = 'workbook:Archero - Dragon Statues.xlsx:sheet:Lookup:row:2'
  and source_records.entity_type = 'dragon_statue_source_metadata';
