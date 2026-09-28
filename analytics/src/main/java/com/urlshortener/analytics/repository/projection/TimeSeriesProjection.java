package com.urlshortener.analytics.repository.projection;

public interface TimeSeriesProjection {
    String getLabel();
    long getCount();
    long getHumanCount();
    long getBotCount();
}
