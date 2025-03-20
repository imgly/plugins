export const PLUGIN_ICON_SET_ID = '@imgly/plugin-fal-ai';

const iconSprite = `
<svg>
  <symbol
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    id="@imgly/plugin/fal-ai/ratioFree"
  >
  <path d="M7 6C6.44772 6 6 6.44772 6 7V9.22222H4V7C4 5.34315 5.34315 4 7 4H9.22222V6H7Z" fill="currentColor"/>
  <path d="M17 6H14.7778V4H17C18.6569 4 20 5.34315 20 7V9.22222H18V7C18 6.44772 17.5523 6 17 6Z" fill="currentColor"/>
  <path d="M6 14.7778V17C6 17.5523 6.44772 18 7 18H9.22222V20H7C5.34315 20 4 18.6569 4 17V14.7778H6Z" fill="currentColor"/>
  <path d="M18 17V14.7778H20V17C20 18.6569 18.6569 20 17 20H14.7778V18H17C17.5523 18 18 17.5523 18 17Z" fill="currentColor"/>
  </symbol>
  <symbol
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    id="@imgly/plugin/fal-ai/ratio4by3"
  >
  <path d="M6.5 13H8V15H10V16.5H6.5V13Z" fill="currentColor"/>
  <path d="M14 9V7.5H17.5V11H16V9H14Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6 4C4.34315 4 3 5.34315 3 7V17C3 18.6569 4.34315 20 6 20H18C19.6569 20 21 18.6569 21 17V7C21 5.34315 19.6569 4 18 4H6ZM5 7C5 6.44772 5.44772 6 6 6H18C18.5523 6 19 6.44772 19 7V17C19 17.5523 18.5523 18 18 18H6C5.44772 18 5 17.5523 5 17V7Z" fill="currentColor"/>
  </symbol>
  <symbol
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    id="@imgly/plugin/fal-ai/ratio16by9"
  >
  <path d="M4.5 13H6V15H8V16.5H4.5V13Z" fill="currentColor"/>
  <path d="M16 9V7.5H19.5V11H18V9H16Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C2.34315 4 1 5.34315 1 7V17C1 18.6569 2.34315 20 4 20H20C21.6569 20 23 18.6569 23 17V7C23 5.34315 21.6569 4 20 4H4ZM3 7C3 6.44772 3.44772 6 4 6H20C20.5523 6 21 6.44772 21 7V17C21 17.5523 20.5523 18 20 18H4C3.44772 18 3 17.5523 3 17V7Z" fill="currentColor"/>
  </symbol>
  <symbol
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    id="@imgly/plugin/fal-ai/ratio9by16"
  >
  <path d="M7.5 16H9V18H11V19.5H7.5V16Z" fill="currentColor"/>
  <path d="M13 6V4.5H16.5V8H15V6H13Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4 20C4 21.6569 5.34315 23 7 23H17C18.6569 23 20 21.6569 20 20V4C20 2.34315 18.6569 1 17 1H7C5.34315 1 4 2.34315 4 4V20ZM7 21C6.44772 21 6 20.5523 6 20V4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V20C18 20.5523 17.5523 21 17 21H7Z" fill="currentColor"/>
  </symbol>
  <symbol
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    id="@imgly/plugin/fal-ai/ratio3by4"
  >
  <path d="M11 17.5V16H9V14H7.5V17.5H11Z" fill="currentColor"/>
  <path d="M15 10H16.5V6.5H13V8H15V10Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M20 18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V6C4 4.34315 5.34315 3 7 3H17C18.6569 3 20 4.34315 20 6V18ZM17 19C17.5523 19 18 18.5523 18 18V6C18 5.44772 17.5523 5 17 5H7C6.44771 5 6 5.44771 6 6V18C6 18.5523 6.44772 19 7 19H17Z" fill="currentColor"/>
  </symbol>
  <symbol
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    id="@imgly/plugin/fal-ai/ratio1by1"
  >
  <path d="M17.4142 8.00009L16 6.58587L14.2929 8.29298L15.7071 9.70719L17.4142 8.00009Z" fill="currentColor"/>
  <path d="M13.0404 12.3739L15.0404 10.3739L13.6262 8.95965L11.6262 10.9596L13.0404 12.3739Z" fill="currentColor"/>
  <path d="M10.3737 15.0405L12.3737 13.0405L10.9595 11.6263L8.95953 13.6263L10.3737 15.0405Z" fill="currentColor"/>
  <path d="M9.70708 15.7072L8.29286 14.293L6.58576 16.0001L7.99997 17.4143L9.70708 15.7072Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7 4C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7ZM6 7C6 6.44772 6.44772 6 7 6H17C17.5523 6 18 6.44772 18 7V17C18 17.5523 17.5523 18 17 18H7C6.44772 18 6 17.5523 6 17V7Z" fill="currentColor"/>
  </symbol>
</svg>
`;

export default iconSprite;
