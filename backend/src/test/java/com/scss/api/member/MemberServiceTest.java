package com.scss.api.member;

import com.scss.api.member.dto.MemberDto;
import com.scss.api.member.service.MemberService;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.transaction.annotation.Transactional;

@RunWith(SpringRunner.class)
@SpringBootTest
public class MemberServiceTest {

    @Autowired
    MemberService memberService;

    @Test
    @Transactional
    void signUp(){
        MemberDto memberDto = new MemberDto("ssassfywwswweb", "your_pawwssssdword","임혜ss은","casslice","calicewsdsssdeweedeb@fjdks","dsdd",0,null);
        String res = memberService.signup(memberDto);
        Assertions.assertThat(res).isEqualTo("success");
    }
}