DO
$$
BEGIN
   -- Terminate active connections to the database
   PERFORM pg_terminate_backend(pg_stat_activity.pid)
   FROM pg_stat_activity
   WHERE pg_stat_activity.datname = 'indexer'
     AND pid <> pg_backend_pid();

   -- Check if the database exists
   IF EXISTS (SELECT FROM pg_database WHERE datname = 'indexer') THEN
      RAISE NOTICE 'Database "indexer" already exists.';
   ELSE
      CREATE DATABASE indexer;
   END IF;
END
$$;
