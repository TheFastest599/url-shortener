-- Initialize separate databases for each microservice domain on initial cluster startup
CREATE DATABASE url_shortener_auth;
CREATE DATABASE url_shortener_core;
CREATE DATABASE url_shortener_analytics;
