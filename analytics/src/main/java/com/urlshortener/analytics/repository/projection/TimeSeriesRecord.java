package com.urlshortener.analytics.repository.projection;

public record TimeSeriesRecord(
        String label,
        long count,
        long humanCount,
        long botCount
) implements TimeSeriesProjection {
    @Override
    public String getLabel() {
        return label;
    }

    @Override
    public long getCount() {
        return count;
    }

    @Override
    public long getHumanCount() {
        return humanCount;
    }

    @Override
    public long getBotCount() {
        return botCount;
    }
}
