package com.ssafy.beecareful.common.util;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class LocalDateTimeToUTCSerializer extends JsonSerializer<LocalDateTime> {
    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        ZonedDateTime utcTime = value.atZone(ZoneId.systemDefault()).withZoneSameInstant(ZoneId.of("UTC"));

        gen.writeString(utcTime.format(DateTimeFormatter.ISO_INSTANT));
    }

}
