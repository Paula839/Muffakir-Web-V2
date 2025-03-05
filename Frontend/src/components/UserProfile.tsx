import React from 'react';
import { PiStudentBold } from "react-icons/pi";

type UserProfileProps = {
  guest: string;
  image?: string;
};
function UserProfile({ guest, image }: UserProfileProps) {
  return (
      <div className="profile">
          {image ? (
              <img src={image} alt="User" className="profile-image" />
          ) : (
              <div className="profile-icon">👤</div>
          )}
          <span>{guest}</span>
      </div>
  );
}

export default UserProfile;
