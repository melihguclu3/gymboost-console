import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
    width: 192,
    height: 192,
};

export const contentType = 'image/png';

export function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '36px',
                    position: 'relative',
                }}
            >
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M18.6667 2.66666L4 17.3333H14.6667L13.3333 29.3333L28 14.6667H17.3333L18.6667 2.66666Z"
                        fill="#F97316"
                    />
                </svg>

                <div
                    style={{
                        position: 'absolute',
                        bottom: 15,
                        right: 15,
                        background: '#F97316',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '24px',
                        fontWeight: '900',
                        display: 'flex',
                    }}
                >
                    DEV
                </div>
            </div>
        ),
        size
    );
}
