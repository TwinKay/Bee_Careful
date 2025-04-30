package com.ssafy.beecareful.security.util;


import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityContextUtil {
    public Optional<Long> extractMemberId(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication==null){
            return Optional.empty();
        }else{
            return Optional.of(
                    Long.parseLong(
                            ((UserDetailsImpl) authentication.getPrincipal()).getMemberId())
            );
        }
    }


    public Optional<String> extractNickname(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication==null){
            return Optional.empty();
        }else{
            return Optional.of(
                            ((UserDetailsImpl) authentication.getPrincipal()).getNickname()
            );
        }
    }

}
