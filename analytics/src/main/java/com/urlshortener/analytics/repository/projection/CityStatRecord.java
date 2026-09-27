package com.urlshortener.analytics.repository.projection;

public record CityStatRecord(String city, String country, long count) implements CityStatProjection {
    @Override
    public String getCity() {
        return city;
    }

    @Override
    public String getCountry() {
        return country;
    }

    @Override
    public long getCount() {
        return count;
    }
}
