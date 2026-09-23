import { useId, type ReactNode, type SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function ClayIcon({ title, children, ...props }: IconProps & { title: string; children: (id: string) => ReactNode }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label={title} {...props}>
      <title>{title}</title>
      <defs>
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <ellipse cx="80" cy="137" rx="43" ry="8" fill="currentColor" opacity=".16" filter={`url(#${id}-shadow)`} />
      {children(id)}
    </svg>
  );
}

export function ElectronicsIcon(props: IconProps) {
  return <ClayIcon title="Fone de ouvido 3D" {...props}>{(id) => <>
    <defs>
      <linearGradient id={`${id}-band`} x1="35" y1="30" x2="125" y2="112" gradientUnits="userSpaceOnUse"><stop stopColor="#F7FAFC"/><stop offset=".48" stopColor="#A8D8F5"/><stop offset="1" stopColor="#4A8CCF"/></linearGradient>
      <linearGradient id={`${id}-pad`} x1="40" y1="70" x2="112" y2="125" gradientUnits="userSpaceOnUse"><stop stopColor="#79BFE9"/><stop offset="1" stopColor="#285E9D"/></linearGradient>
    </defs>
    <path d="M38 82V68c0-30 18-47 42-47s42 17 42 47v14" fill="none" stroke={`url(#${id}-band)`} strokeWidth="18" strokeLinecap="round"/>
    <rect x="25" y="70" width="33" height="55" rx="16" fill={`url(#${id}-pad)`}/><rect x="102" y="70" width="33" height="55" rx="16" fill={`url(#${id}-pad)`}/>
    <rect x="34" y="77" width="15" height="38" rx="8" fill="#DDEEF8" opacity=".78"/><rect x="111" y="77" width="15" height="38" rx="8" fill="#DDEEF8" opacity=".78"/>
    <path d="M51 44c13-17 40-19 57-4" fill="none" stroke="#FFF" strokeWidth="5" strokeLinecap="round" opacity=".68"/>
  </>}</ClayIcon>;
}

export function FashionIcon(props: IconProps) {
  return <ClayIcon title="Camiseta coral 3D" {...props}>{(id) => <>
    <defs><linearGradient id={`${id}-shirt`} x1="42" y1="32" x2="119" y2="132" gradientUnits="userSpaceOnUse"><stop stopColor="#FF9B98"/><stop offset=".48" stopColor="#F36F76"/><stop offset="1" stopColor="#C94860"/></linearGradient></defs>
    <path d="M56 36c7 9 15 13 24 13s17-4 24-13l27 17-15 28-13-7v56H57V74l-13 7-15-28 27-17Z" fill={`url(#${id}-shirt)`}/>
    <path d="M64 34c2 12 8 18 16 18s14-6 16-18" fill="none" stroke="#FFD4D2" strokeWidth="7" strokeLinecap="round"/>
    <path d="M47 54 58 48M101 49l12 6" stroke="#FFF" strokeWidth="4" strokeLinecap="round" opacity=".55"/>
    <path d="M102 84h18v25h-18z" fill="#FFD77A" rx="3"/><circle cx="111" cy="90" r="2" fill="#B57B31"/>
  </>}</ClayIcon>;
}

export function HomeIcon(props: IconProps) {
  return <ClayIcon title="Poltrona verde-água 3D" {...props}>{(id) => <>
    <defs><linearGradient id={`${id}-chair`} x1="38" y1="40" x2="113" y2="129" gradientUnits="userSpaceOnUse"><stop stopColor="#AEE8D8"/><stop offset=".55" stopColor="#62C2B4"/><stop offset="1" stopColor="#319287"/></linearGradient></defs>
    <rect x="39" y="43" width="75" height="70" rx="28" fill={`url(#${id}-chair)`}/><rect x="27" y="77" width="29" height="50" rx="14" fill="#72CDBE"/><rect x="101" y="77" width="29" height="50" rx="14" fill="#4EAD9F"/><rect x="44" y="91" width="69" height="40" rx="17" fill="#8EDBCC"/>
    <path d="M51 54c14-9 35-9 48 0" fill="none" stroke="#E9FFF8" strokeWidth="5" strokeLinecap="round" opacity=".55"/><path d="M48 128v8M110 128v8" stroke="#7B6B5D" strokeWidth="7" strokeLinecap="round"/>
    <path d="M125 70c-9-12-5-21 1-26 8 8 8 17-1 26ZM128 73c7-12 16-13 22-10-3 10-10 14-22 10Z" fill="#78B96F"/><path d="M128 68v29" stroke="#567F50" strokeWidth="3"/><path d="M117 93h23l-4 31h-15l-4-31Z" fill="#E8CBA3"/>
  </>}</ClayIcon>;
}

export function PhonesIcon(props: IconProps) {
  return <ClayIcon title="Smartphone moderno 3D" {...props}>{(id) => <>
    <defs><linearGradient id={`${id}-phone`} x1="46" y1="28" x2="118" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#5EC7F5"/><stop offset=".46" stopColor="#665DE8"/><stop offset="1" stopColor="#EF6FAB"/></linearGradient><linearGradient id={`${id}-edge`} x1="44" y1="25" x2="120" y2="135"><stop stopColor="#F0F5FA"/><stop offset="1" stopColor="#70829A"/></linearGradient></defs>
    <g transform="rotate(10 80 80)"><rect x="45" y="20" width="72" height="119" rx="17" fill={`url(#${id}-edge)`}/><rect x="50" y="25" width="62" height="109" rx="13" fill={`url(#${id}-phone)`}/><path d="M55 99c20-35 36-42 57-48v83H50c0-12 1-23 5-35Z" fill="#55D8C8" opacity=".62"/><rect x="71" y="29" width="21" height="5" rx="2.5" fill="#24364C"/><circle cx="103" cy="37" r="6" fill="#253951"/><circle cx="103" cy="37" r="2.5" fill="#9AD8FF"/></g>
    <path d="M62 36c9-8 20-10 28-8" fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" opacity=".5"/>
  </>}</ClayIcon>;
}

export function GamesIcon(props: IconProps) {
  return <ClayIcon title="Controle de videogame roxo 3D" {...props}>{(id) => <>
    <defs><linearGradient id={`${id}-game`} x1="35" y1="48" x2="126" y2="126" gradientUnits="userSpaceOnUse"><stop stopColor="#9A8CF3"/><stop offset=".5" stopColor="#6657CE"/><stop offset="1" stopColor="#3C3A92"/></linearGradient></defs>
    <path d="M47 56c-15 3-22 18-25 45-3 24 9 32 23 14l14-18h42l14 18c14 18 26 10 23-14-3-27-10-42-25-45-19-4-47-4-66 0Z" fill={`url(#${id}-game)`}/>
    <path d="M42 65c23-9 56-9 76 0" fill="none" stroke="#D8D4FF" strokeWidth="5" strokeLinecap="round" opacity=".45"/><path d="M52 71v25M39 83h26" stroke="#DDEBFF" strokeWidth="7" strokeLinecap="round"/><circle cx="112" cy="76" r="6" fill="#FF7F91"/><circle cx="124" cy="88" r="6" fill="#FFD45E"/><circle cx="100" cy="88" r="6" fill="#65DAB1"/><circle cx="112" cy="100" r="6" fill="#68B9F0"/><circle cx="79" cy="80" r="4" fill="#D9D5FF"/>
  </>}</ClayIcon>;
}

export function BeautyIcon(props: IconProps) {
  return <ClayIcon title="Frasco de perfume rosa e dourado 3D" {...props}>{(id) => <>
    <defs><linearGradient id={`${id}-glass`} x1="47" y1="48" x2="111" y2="133" gradientUnits="userSpaceOnUse"><stop stopColor="#FFD7E5" stopOpacity=".9"/><stop offset=".5" stopColor="#ED8FB4" stopOpacity=".88"/><stop offset="1" stopColor="#B94D80"/></linearGradient><linearGradient id={`${id}-gold`} x1="56" y1="25" x2="102" y2="58"><stop stopColor="#FFF1AA"/><stop offset=".5" stopColor="#D9A641"/><stop offset="1" stopColor="#9A6727"/></linearGradient></defs>
    <rect x="45" y="55" width="70" height="77" rx="22" fill={`url(#${id}-glass)`}/><rect x="61" y="39" width="38" height="23" rx="6" fill={`url(#${id}-gold)`}/><rect x="68" y="23" width="24" height="20" rx="5" fill="#F3CD73"/><path d="M57 65c12-9 30-10 43-4" fill="none" stroke="#FFF" strokeWidth="6" strokeLinecap="round" opacity=".6"/><ellipse cx="80" cy="96" rx="20" ry="16" fill="#FFF0F5" opacity=".38"/><path d="m127 42 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#F4C75B"/>
  </>}</ClayIcon>;
}

export function SportsIcon(props: IconProps) {
  return <ClayIcon title="Bola esportiva laranja e azul 3D" {...props}>{(id) => <>
    <defs><radialGradient id={`${id}-ball`} cx="0" cy="0" r="1" gradientTransform="translate(55 48) rotate(48) scale(97)" gradientUnits="userSpaceOnUse"><stop stopColor="#FFBF69"/><stop offset=".56" stopColor="#F27A32"/><stop offset="1" stopColor="#C84C28"/></radialGradient></defs>
    <circle cx="80" cy="79" r="52" fill={`url(#${id}-ball)`}/><path d="M33 61c26 10 55 9 91-7M40 111c24-18 54-29 89-27M72 28c14 28 14 69-2 102M108 39c-22 22-28 57-14 85" fill="none" stroke="#2866A5" strokeWidth="6" strokeLinecap="round"/><path d="M49 45c10-9 22-12 32-11" fill="none" stroke="#FFF4D8" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
  </>}</ClayIcon>;
}
