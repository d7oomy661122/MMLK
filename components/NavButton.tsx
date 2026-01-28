import React from 'react';

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}>
        <Icon className={`w-6 h-6 ${active ? 'fill-primary/20' : ''}`} />
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

export default NavButton;