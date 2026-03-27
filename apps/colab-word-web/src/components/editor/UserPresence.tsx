import { Users } from 'lucide-react';

interface UserPresenceProps {
  users: any[];
}

export default function UserPresence({ users }: UserPresenceProps) {
  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-gray-600" />
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user, index) => (
          <div
            key={user.user?.name || index}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: user.user?.color || '#888' }}
            title={user.user?.name}
          >
            {user.user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs font-semibold">
            +{users.length - 5}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600">
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </span>
    </div>
  );
}
