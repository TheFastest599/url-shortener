package com.urlshortener.analytics.repository.projection;

public record StatRecord(String name, long count) implements StatProjection {
    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getCount() {
        return count;
    }
}
