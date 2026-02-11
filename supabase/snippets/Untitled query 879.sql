SELECT
  queryid,
  query,
  calls
FROM pg_stat_statements
LIMIT 50;
