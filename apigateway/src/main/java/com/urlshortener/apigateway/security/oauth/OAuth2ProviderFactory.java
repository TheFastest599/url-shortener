package com.urlshortener.apigateway.security.oauth;


import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class OAuth2ProviderFactory {

    private final Map<String, OAuth2IdentityProvider> providers;

    public OAuth2ProviderFactory(List<OAuth2IdentityProvider> providerList) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(
                        p -> p.getProviderName().toUpperCase(),
                        p -> p
                ));
    }

    public OAuth2IdentityProvider getProvider(String providerName) {
        OAuth2IdentityProvider provider = providers.get(providerName.toUpperCase());

        if (provider == null){
            throw new IllegalArgumentException("Unsupported OAuth2 Provider: " + providerName);
        }
        return provider;
    }
}
