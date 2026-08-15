package com.urlshortener.core.util;


import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class Base62 {

    private static final String BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = BASE62_ALPHABET.length();
    private static final SecureRandom RANDOM = new SecureRandom();

    public String encode(long number){
        StringBuilder sb = new StringBuilder();
        while (number > 0){
            sb.append(BASE62_ALPHABET.charAt((int) (number % BASE)));
            number /= BASE;
        }
        return sb.reverse().toString();
    };

    public String generateRandomShortCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++){
            sb.append(BASE62_ALPHABET.charAt(RANDOM.nextInt(BASE)));
        }
        return sb.toString();
    }

}
