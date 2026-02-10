import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-react";
import { logout } from '../store/slices/oauth/oauthSlice';
import { logoutUser } from '../store/slices/oauth/oauthThunks';
import type { RootState } from '../store';

export function AvatarDropdown() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((state: RootState) => state.oauth);

  const handleSignOut = async () => {
    if (accessToken) {
      await dispatch(logoutUser(accessToken) as any);
    }
    dispatch(logout());
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  if (!user) {
    return null;
  }

  return (
    <Dropdown
      label={
        <Avatar
          alt="User settings"
          img={user.avatarUrl}
          rounded
          className="cursor-pointer"
        />
      }
      arrowIcon={false}
      inline
    >
      <DropdownHeader>
        <span className="block text-sm">{user.name}</span>
        <span className="block truncate text-sm font-medium">{user.email}</span>
      </DropdownHeader>
      <DropdownItem onClick={handleProfile}>Profile</DropdownItem>
      <DropdownItem onClick={handleSettings}>Settings</DropdownItem>

      <DropdownDivider />
      <DropdownItem onClick={handleSignOut}>Sign out</DropdownItem>
    </Dropdown>
  );
}