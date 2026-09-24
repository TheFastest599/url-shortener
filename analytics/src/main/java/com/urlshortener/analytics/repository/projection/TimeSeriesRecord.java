package com.urlshortener.analytics.repository.projection;

public record TimeSeriesRecord(String label, long count) implements TimeSeriesProjection {
    @Override
    public String getLabel() {
        return label;
    }

    @Override
    public long getCount() {
        return count;
    }
}
