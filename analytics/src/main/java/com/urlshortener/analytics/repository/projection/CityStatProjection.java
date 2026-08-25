package com.urlshortener.analytics.repository.projection;

public interface CityStatProjection {
    String getCity();
    String getCountry();
    long getCount();
}
