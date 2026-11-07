update tier_rankings
set
  tier = 'S',
  score = 90,
  notes = concat(
    notes,
    ' Normalized from SS to S for the Archero Hub weapon board.'
  )
from items, tier_lists
where tier_rankings.item_id = items.id
  and tier_rankings.tier_list_id = tier_lists.id
  and items.category = 'weapon'
  and tier_lists.title = 'Archero Discord Tier List'
  and tier_lists.game_version = '6.10.2'
  and tier_rankings.tier = 'SS';
