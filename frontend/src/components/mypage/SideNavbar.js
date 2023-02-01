import styled from 'styled-components'
import { FaRegBookmark, FaRegUser, FaListUl } from 'react-icons/fa'
import { NavLink } from 'react-router-dom'
import sideNavBlueBg from 'assets/img/side_nav_blue_bg.png'

/*
마이페이지에서 사용할 사이드 네비게이션 바
*/
const SideNavbar = () => {
  return (
    <SideNav>
      <NavStyle to="/mypage/calendar">
        <FaRegBookmark />
        스터디 기록
      </NavStyle>
      <NavStyle to="/mypage/solved">
        <FaListUl />
        내가 푼 문제
      </NavStyle>
      <NavStyle to="/mypage/profile">
        <FaRegUser />
        회원 정보
      </NavStyle>
    </SideNav>
  )
}

export default SideNavbar

const SideNav = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  margin: 1.5rem 0rem;
`

const NavStyle = styled(NavLink)`
  padding: 1rem 0rem 1rem 3rem;

  background-image: url(${sideNavBlueBg});
  background-repeat: no-repeat;
  background-position: 350% 0%;

  color: ${({ theme }) => theme.secondaryColor};
  font-size: 1.2rem;
  font-weight: 400;

  transition: background-position 0.3s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.primaryColor};
    font-weight: 600;
  }

  &.active {
    color: white;
    font-weight: 600;
    background-position: 0% 0%;
  }

  & > svg {
    margin-right: 1rem;
  }
`