psql trees -t -c 'select json_agg(distinct(lower(genus))) from trees_api_tree;' > data/genus.json
psql trees -t -c 'select json_agg(distinct(lower(species))) from trees_api_tree;' > data/species.json
