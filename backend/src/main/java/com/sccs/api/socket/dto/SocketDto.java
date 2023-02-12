package com.sccs.api.socket.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SocketDto {

  private int studyroomId;
  private String nickname;
  private String message;
  private String status;
  private int personnel;
  private boolean ready;
  private String presenter;
  private String profileImage;

  private List<String> membersNickname;
  private List<String> readyForStudyArray;

}
