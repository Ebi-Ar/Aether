
import { EditorElement } from './store';

export const createDefaultElement = (subtype: string, id: string, dropX: number = 0, dropY: number = 0): EditorElement[] => {
    let newElements: EditorElement[] = [];

    if (subtype === 'navbar') {
        // Container
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'Navbar Background',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '80px',
                display: 'block',
                zIndex: 100,
                backgroundColor: '#ffffff',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #f3f4f6',
                pointerEvents: 'auto',
                boxSizing: 'border-box'
            },
            behaviors: []
        });

        // Brand
        newElements.push({
            id: `${id}-brand`,
            type: 'text',
            name: 'Navbar Brand',
            content: 'Brand',
            style: {
                position: 'absolute',
                top: `${dropY + 24}px`,
                left: '32px',
                width: 'auto',
                height: 'auto',
                fontSize: '24px',
                fontWeight: '800',
                color: '#000',
                letterSpacing: '-0.025em',
                zIndex: 101,
                display: 'block'
            },
            behaviors: []
        });

        // Links as real buttons (not plain text)
        const links = ['Features', 'Pricing', 'About', 'Contact'];
        links.forEach((link, idx) => {
            newElements.push({
                id: `${id}-link-${idx}`,
                type: 'box',
                name: `Nav Button ${link}`,
                content: `<button type="button" style="width:100%; height:100%; border:none; background:transparent; color:#4b5563; font-size:14px; font-weight:500; cursor:pointer; padding:0; margin:0;">${link}</button>`,
                style: {
                    position: 'absolute',
                    top: `${dropY + 24}px`,
                    left: `${184 + (idx * 92)}px`,
                    width: '88px',
                    height: '32px',
                    cursor: 'pointer',
                    zIndex: 101,
                    display: 'block',
                    backgroundColor: 'transparent',
                    borderRadius: '8px'
                },
                behaviors: []
            });
        });

        // Button
        newElements.push({
            id: `${id}-btn`,
            type: 'box',
            name: 'Nav Button',
            content: '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:500; font-size:14px;">Get Started</div>',
            style: {
                position: 'absolute',
                top: `${dropY + 20}px`,
                left: '700px', // Safer margin
                width: '120px',
                height: '40px',
                backgroundColor: '#000',
                borderRadius: '9999px',
                cursor: 'pointer',
                zIndex: 101,
                display: 'flex'
            },
            behaviors: []
        });

    } else if (subtype === 'hero') {
        // Hero remains a single block for now, or decompose if requested later.
        // User asked for "every element in navbar" specifically, but implied "make exactly what u made"
        // For efficiency, I will wrap the others in [] for now to fix type errors, and decompose on demand or iteratively.
        // Background
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'Hero Background',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '600px',
                display: 'block',
                background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
                zIndex: 10,
                pointerEvents: 'auto',
                boxSizing: 'border-box'
            },
            behaviors: []
        });

        // Badge
        newElements.push({
            id: `${id}-badge`,
            type: 'box',
            name: 'Hero Badge',
            content: '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#2563eb;"><span style="width:8px; height:8px; border-radius:50%; background-color:#2563eb;"></span>NEW VERSION 2.0</div>',
            style: {
                position: 'absolute',
                top: `${dropY + 120}px`,
                left: '350px', // Centered approx (900-200)/2
                width: '200px',
                height: '32px',
                backgroundColor: '#eff6ff',
                borderRadius: '9999px',
                zIndex: 11
            },
            behaviors: []
        });

        // Heading
        newElements.push({
            id: `${id}-heading`,
            type: 'text',
            name: 'Hero Heading',
            content: 'Create something extraordinary.',
            style: {
                position: 'absolute',
                top: `${dropY + 180}px`,
                left: '50px',
                width: '800px',
                height: 'auto',
                fontSize: '60px',
                fontWeight: '800',
                textAlign: 'center',
                color: '#111827',
                letterSpacing: '-0.025em',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        // Subtext
        newElements.push({
            id: `${id}-subtext`,
            type: 'text',
            name: 'Hero Subtext',
            content: 'The ultimate platform for building beautiful, high-performance websites without writing a single line of code.',
            style: {
                position: 'absolute',
                top: `${dropY + 340}px`,
                left: '150px',
                width: '600px',
                height: 'auto',
                fontSize: '20px',
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: '1.6',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        // Button Primary
        newElements.push({
            id: `${id}-btn-primary`,
            type: 'box', // Using box for button container to keep it simple but styles editable
            name: 'Hero Button Primary',
            content: '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:500;">Start Building</div>',
            style: {
                position: 'absolute',
                top: `${dropY + 440}px`,
                left: '280px',
                width: '160px',
                height: '50px',
                backgroundColor: '#000',
                borderRadius: '9999px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                zIndex: 11
            },
            behaviors: []
        });

        // Button Secondary
        newElements.push({
            id: `${id}-btn-secondary`,
            type: 'box',
            name: 'Hero Button Secondary',
            content: '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#111827; font-weight:500;">Documentation</div>',
            style: {
                position: 'absolute',
                top: `${dropY + 440}px`,
                left: '460px',
                width: '160px',
                height: '50px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '9999px',
                cursor: 'pointer',
                zIndex: 11
            },
            behaviors: []
        });
    } else if (subtype === 'features') {
        // Background
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'Features Background',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '200px',
                display: 'block',
                backgroundColor: '#ffffff',
                zIndex: 10,
                boxSizing: 'border-box'
            },
            behaviors: []
        });

        // Heading
        newElements.push({
            id: `${id}-heading`,
            type: 'text',
            name: 'Features Heading',
            content: 'Everything you need',
            style: {
                position: 'absolute',
                top: `${dropY + 50}px`,
                left: '200px', // Center-ish
                width: '500px',
                height: 'auto',
                fontSize: '36px',
                fontWeight: '800',
                textAlign: 'center',
                color: '#111827',
                letterSpacing: '-0.025em',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        // Subtext
        newElements.push({
            id: `${id}-subtext`,
            type: 'text',
            name: 'Features Subtext',
            content: 'Powerful features to help you build faster/better.',
            style: {
                position: 'absolute',
                top: `${dropY + 100}px`,
                left: '150px',
                width: '600px',
                height: 'auto',
                fontSize: '18px',
                color: '#4b5563',
                textAlign: 'center',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        // Removed the 3 fixed feature cards as requested.
        // User can drag in 'Card' elements from sidebar.
    } else if (subtype === 'testimonials') {
        // Background
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'Testimonials Background',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '500px',
                display: 'block',
                backgroundColor: '#ffffff',
                zIndex: 10,
                boxSizing: 'border-box'
            },
            behaviors: []
        });

        // Heading
        newElements.push({
            id: `${id}-heading`,
            type: 'text',
            name: 'Testimonials Heading',
            content: 'Loved by thousands',
            style: {
                position: 'absolute',
                top: `${dropY + 60}px`,
                left: '250px',
                width: '400px',
                height: 'auto',
                fontSize: '30px',
                fontWeight: '700',
                textAlign: 'center',
                color: '#111827',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        const testimonials = [
            {
                quote: "This product has completely transformed how we work. I can't imagine going back to the old way.",
                name: "Sarah Johnson",
                role: "CTO at TechFlow",
                gradient: "linear-gradient(135deg, #60a5fa, #2563eb)"
            },
            {
                quote: "The best investment we've made this year. The ROI was immediate and substantial.",
                name: "Michael Chen",
                role: "Founder of StartUp",
                gradient: "linear-gradient(135deg, #c084fc, #9333ea)"
            },
            {
                quote: "Incredible support team and a rock-solid platform. Highly recommended.",
                name: "Emma Davis",
                role: "Product Lead",
                gradient: "linear-gradient(135deg, #4ade80, #16a34a)"
            }
        ];

        testimonials.forEach((t, i) => {
            const cardLeft = 40 + (i * 280); // 40, 320, 600 approx (fits in 900)
            const cardTop = dropY + 150;

            // Card Background
            newElements.push({
                id: `${id}-card-${i}`,
                type: 'box',
                name: `Testimonial Card ${i + 1}`,
                content: '',
                style: {
                    position: 'absolute',
                    top: `${cardTop}px`,
                    left: `${cardLeft}px`,
                    width: '260px',
                    height: '280px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 11
                },
                behaviors: []
            });

            // Stars
            newElements.push({
                id: `${id}-stars-${i}`,
                type: 'text',
                name: 'Stars',
                content: '★★★★★',
                style: {
                    position: 'absolute',
                    top: `${cardTop + 32}px`,
                    left: `${cardLeft + 32}px`,
                    width: 'auto',
                    height: 'auto',
                    fontSize: '16px',
                    color: '#eab308',
                    zIndex: 12,
                    display: 'block'
                },
                behaviors: []
            });

            // Quote
            newElements.push({
                id: `${id}-quote-${i}`,
                type: 'text',
                name: 'Quote',
                content: `"${t.quote}"`,
                style: {
                    position: 'absolute',
                    top: `${cardTop + 60}px`,
                    left: `${cardLeft + 32}px`,
                    width: '196px', // 260 - 64 padding
                    height: 'auto',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: '#d1d5db',
                    zIndex: 12,
                    display: 'block'
                },
                behaviors: []
            });

            // Avatar
            newElements.push({
                id: `${id}-avatar-${i}`,
                type: 'box',
                name: 'Avatar',
                content: '',
                style: {
                    position: 'absolute',
                    top: `${cardTop + 200}px`, // Pushed to bottom
                    left: `${cardLeft + 32}px`,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: t.gradient,
                    zIndex: 12
                },
                behaviors: []
            });

            // Name
            newElements.push({
                id: `${id}-name-${i}`,
                type: 'text',
                name: 'Name',
                content: t.name,
                style: {
                    position: 'absolute',
                    top: `${cardTop + 200}px`,
                    left: `${cardLeft + 88}px`, // 32 + 40 + 16 gap
                    width: 'auto',
                    height: 'auto',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#fff',
                    zIndex: 12,
                    display: 'block'
                },
                behaviors: []
            });

            // Role
            newElements.push({
                id: `${id}-role-${i}`,
                type: 'text',
                name: 'Role',
                content: t.role,
                style: {
                    position: 'absolute',
                    top: `${cardTop + 220}px`,
                    left: `${cardLeft + 88}px`,
                    width: 'auto',
                    height: 'auto',
                    fontSize: '12px',
                    color: '#9ca3af',
                    zIndex: 12,
                    display: 'block'
                },
                behaviors: []
            });
        });
    } else if (subtype === 'pricing') {
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'Pricing Tier',
            content: `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; padding:0 32px; background-color:#ffffff; color:#111827;">
                    <div style="max-width:1100px; margin:0 auto; width:100%;">
                        <div style="text-align:center; margin-bottom:48px;">
                            <h2 style="font-size:30px; font-weight:700; margin-bottom:16px; color:#111827;">Simple, transparent pricing</h2>
                            <p style="color:#6b7280;">Choose the plan that's right for you.</p>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:32px; align-items:center;">
                            <!-- Basic -->
                            <div style="padding:32px; background-color:#fff; border-radius:16px; border:1px solid #e5e7eb; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);">
                                <h3 style="font-size:18px; font-weight:600; margin-bottom:8px; color:#111827;">Basic</h3>
                                <div style="display:flex; align-items:baseline; gap:4px; margin-bottom:24px;">
                                    <span style="font-size:36px; font-weight:700; color:#111827;">$29</span>
                                    <span style="color:#6b7280;">/mo</span>
                                </div>
                                <ul style="margin-bottom:32px; color:#4b5563; font-size:14px; line-height:2;">
                                    <li>✓ 5 Projects</li>
                                    <li>✓ Basic Analytics</li>
                                    <li>✓ 24/7 Support</li>
                                </ul>
                                <button style="width:100%; padding:12px; background-color:#f3f4f6; color:#111827; font-weight:500; border-radius:12px; border:none; cursor:pointer;">Get Started</button>
                            </div>
                            <!-- Pro -->
                            <div style="padding:32px; background-color:#000; color:#fff; border-radius:16px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); position:relative; transform:scale(1.05);">
                                <div style="position:absolute; top:-10px; right:10px; background-color:#2563eb; color:white; font-size:12px; font-weight:700; padding:4px 12px; border-radius:9999px;">POPULAR</div>
                                <h3 style="font-size:18px; font-weight:600; margin-bottom:8px; color:#fff;">Pro</h3>
                                <div style="display:flex; align-items:baseline; gap:4px; margin-bottom:24px;">
                                    <span style="font-size:36px; font-weight:700; color:#fff;">$79</span>
                                    <span style="color:#9ca3af;">/mo</span>
                                </div>
                                <ul style="margin-bottom:32px; color:#d1d5db; font-size:14px; line-height:2;">
                                    <li>✓ Unlimited Projects</li>
                                    <li>✓ Advanced Analytics</li>
                                    <li>✓ Priority Support</li>
                                    <li>✓ Custom Domain</li>
                                </ul>
                                <button style="width:100%; padding:12px; background-color:#fff; color:#000; font-weight:500; border-radius:12px; border:none; cursor:pointer;">Start Free Trial</button>
                            </div>
                            <!-- Enterprise -->
                            <div style="padding:32px; background-color:#fff; border-radius:16px; border:1px solid #e5e7eb; box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);">
                                <h3 style="font-size:18px; font-weight:600; margin-bottom:8px; color:#111827;">Enterprise</h3>
                                <div style="display:flex; align-items:baseline; gap:4px; margin-bottom:24px;">
                                    <span style="font-size:36px; font-weight:700; color:#111827;">$199</span>
                                    <span style="color:#6b7280;">/mo</span>
                                </div>
                                <ul style="margin-bottom:32px; color:#4b5563; font-size:14px; line-height:2;">
                                    <li>✓ All Pro Features</li>
                                    <li>✓ SSO & Security</li>
                                    <li>✓ Dedicated Manager</li>
                                </ul>
                                <button style="width:100%; padding:12px; background-color:#f3f4f6; color:#111827; font-weight:500; border-radius:12px; border:none; cursor:pointer;">Contact Sales</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '600px',
                display: 'block',
                boxSizing: 'border-box'
            },
            behaviors: []
        });
    } else if (subtype === 'faq') {
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'FAQ',
            content: `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; padding:0 32px; background-color:#ffffff; color:#111827;">
                    <div style="max-width:700px; margin:0 auto; width:100%;">
                        <h2 style="font-size:30px; font-weight:700; text-align:center; margin-bottom:48px; color:#111827;">Frequently Asked Questions</h2>
                        <div style="display:flex; flex-direction:column; gap:16px;">
                            <div style="padding:24px; border-radius:16px; background-color:#f9fafb;">
                                <h3 style="font-weight:700; margin-bottom:8px; color:#111827;">Can I cancel my subscription anytime?</h3>
                                <p style="color:#4b5563;">Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
                            </div>
                            <div style="padding:24px; border-radius:16px; background-color:#f9fafb;">
                                <h3 style="font-weight:700; margin-bottom:8px; color:#111827;">Do you offer a free trial?</h3>
                                <p style="color:#4b5563;">We offer a 14-day free trial on all paid plans. No credit card required to start.</p>
                            </div>
                            <div style="padding:24px; border-radius:16px; background-color:#f9fafb;">
                                <h3 style="font-weight:700; margin-bottom:8px; color:#111827;">What kind of support do you provide?</h3>
                                <p style="color:#4b5563;">We offer email support for all customers, and priority live chat support for Pro and Enterprise customers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '600px',
                display: 'block',
                boxSizing: 'border-box'
            },
            behaviors: []
        });
    } else if (subtype === 'footer') {
        // Background (Locked)
        newElements.push({
            id: `${id}-bg`,
            type: 'box',
            name: 'Footer Background',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: '0',
                width: '100%',
                height: '400px',
                display: 'block',
                backgroundColor: '#ffffff',
                zIndex: 10,
                pointerEvents: 'auto',
                boxSizing: 'border-box'
            },
            behaviors: []
        });

        // Column 1: Brand
        newElements.push({
            id: `${id}-logo`,
            type: 'box',
            name: 'Footer Logo',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY + 48}px`,
                left: '50px',
                width: '40px',
                height: '40px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                zIndex: 11
            },
            behaviors: []
        });

        newElements.push({
            id: `${id}-tagline`,
            type: 'text',
            name: 'Footer Tagline',
            content: 'Building the future of digital experiences.',
            style: {
                position: 'absolute',
                top: `${dropY + 100}px`,
                left: '50px',
                width: '200px',
                height: 'auto',
                fontSize: '14px',
                color: '#9ca3af',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        // Column 2: Product
        const col2Left = 350;
        newElements.push({
            id: `${id}-col2-head`,
            type: 'text',
            name: 'Product Heading',
            content: 'Product',
            style: {
                position: 'absolute',
                top: `${dropY + 48}px`,
                left: `${col2Left}px`,
                fontWeight: '700',
                color: '#111827',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        ['Features', 'Pricing', 'Changelog'].forEach((text, i) => {
            newElements.push({
                id: `${id}-col2-link-${i}`,
                type: 'text',
                name: `Product Link ${i + 1}`,
                content: text,
                style: {
                    position: 'absolute',
                    top: `${dropY + 80 + (i * 24)}px`,
                    left: `${col2Left}px`,
                    fontSize: '14px',
                    color: '#9ca3af',
                    zIndex: 11,
                    display: 'block'
                },

                behaviors: []
            });
        });

        // Column 3: Company
        const col3Left = 550;
        newElements.push({
            id: `${id}-col3-head`,
            type: 'text',
            name: 'Company Heading',
            content: 'Company',
            style: {
                position: 'absolute',
                top: `${dropY + 48}px`,
                left: `${col3Left}px`,
                fontWeight: '700',
                color: '#111827',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        ['About', 'Careers', 'Blog'].forEach((text, i) => {
            newElements.push({
                id: `${id}-col3-link-${i}`,
                type: 'text',
                name: `Company Link ${i + 1}`,
                content: text,
                style: {
                    position: 'absolute',
                    top: `${dropY + 80 + (i * 24)}px`,
                    left: `${col3Left}px`,
                    fontSize: '14px',
                    color: '#9ca3af',
                    zIndex: 11,
                    display: 'block'
                },

                behaviors: []
            });
        });

        // Column 4: Legal
        const col4Left = 750;
        newElements.push({
            id: `${id}-col4-head`,
            type: 'text',
            name: 'Legal Heading',
            content: 'Legal',
            style: {
                position: 'absolute',
                top: `${dropY + 48}px`,
                left: `${col4Left}px`,
                fontWeight: '700',
                color: '#111827',
                zIndex: 11,
                display: 'block'
            },
            behaviors: []
        });

        ['Privacy', 'Terms', 'Security'].forEach((text, i) => {
            newElements.push({
                id: `${id}-col4-link-${i}`,
                type: 'text',
                name: `Legal Link ${i + 1}`,
                content: text,
                style: {
                    position: 'absolute',
                    top: `${dropY + 80 + (i * 24)}px`,
                    left: `${col4Left}px`,
                    fontSize: '14px',
                    color: '#4b5563',
                    zIndex: 11,
                    display: 'block'
                },

                behaviors: []
            });
        });

        // Copyright
        newElements.push({
            id: `${id}-copyright`,
            type: 'text',
            name: 'Copyright',
            content: '© 2024 Brand, Inc. All rights reserved.',
            style: {
                position: 'absolute',
                top: `${dropY + 250}px`,
                left: '0',
                width: '100%',
                textAlign: 'center', // Center text within full width
                fontSize: '14px',
                color: '#6b7280',
                paddingTop: '32px',
                borderTop: '1px solid #1f2937',
                zIndex: 11,
                display: 'block'
            },

            behaviors: []
        });
    } else if (subtype === 'button') {
        newElements.push({
            id,
            type: 'text',
            name: 'Button',
            content: '<button style="padding:12px 24px; background-color:#2563eb; color:#fff; font-weight:600; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); border:none; cursor:pointer;">Click Me</button>',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: 'auto',
                height: 'auto',
                display: 'inline-block'
            },
            behaviors: []
        });
    } else if (subtype === 'card') {
        newElements.push({
            id,
            type: 'box',
            name: 'Card',
            content: `
                <div style="width:100%; height:100%; background-color:#fff; border-radius:16px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); border:1px solid #f3f4f6; overflow:hidden; display:flex; flex-direction:column;">
                    <div style="height:160px; background-color:#f3f4f6; display:flex; align-items:center; justify-content:center; color:#d1d5db;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                    <div style="padding:24px; flex:1; display:flex; flex-direction:column;">
                        <h3 style="font-size:20px; font-weight:700; color:#111827; margin-bottom:8px;">Card Title</h3>
                        <p style="color:#6b7280; font-size:14px; line-height:1.6; margin-bottom:16px; flex:1;">
                            This is a description of the card content. It can be used to display articles, products, or features.
                        </p>
                        <button style="color:#2563eb; font-weight:600; font-size:14px; background:none; border:none; padding:0; cursor:pointer; text-align:left;">Read More →</button>
                    </div>
                </div>
            `,
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: '320px',
                height: '400px',
                display: 'block'
            },
            behaviors: []
        });
    } else if (subtype === 'video') {
        newElements.push({
            id,
            type: 'image', // Placeholder for video
            name: 'Video',
            content: `
                <div style="width:100%; height:100%; background-color:#000; border-radius:12px; overflow:hidden; position:relative; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                    <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80" style="width:100%; height:100%; object-fit:cover; opacity:0.6;" alt="Video thumbnail" />
                    <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                        <div style="width:64px; height:64px; background-color:rgba(255,255,255,0.2); backdrop-filter:blur(4px); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <div style="width:48px; height:48px; background-color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="color:#000; margin-left:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                        </div>
                    </div>
                    <div style="position:absolute; bottom:16px; left:16px; color:#fff;">
                        <div style="font-size:14px; font-weight:500; background-color:rgba(0,0,0,0.5); padding:4px 8px; border-radius:4px; backdrop-filter:blur(4px);">02:45</div>
                    </div>
                </div>
            `,
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: '480px',
                height: '270px',
                display: 'block'
            },
            behaviors: []
        });
    } else if (subtype === 'text') {
        newElements.push({
            id,
            type: 'text',
            name: 'Text',
            content: 'Double click to edit text',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: 'auto',
                height: 'auto',
                fontSize: '16px',
                color: 'black',
                fontWeight: '500',
                textAlign: 'center',
                display: 'block'
            },
            behaviors: []
        });
    } else if (subtype === 'image') {
        newElements.push({
            id,
            type: 'image',
            name: 'Image',
            content: '',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: '200px',
                height: '150px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
            },
            behaviors: []
        });
    } else if (subtype === 'box') {
        newElements.push({
            id,
            type: 'box',
            name: 'Box',
            content: '<div style="width:100%; height:100%; border-radius:8px; border:2px dashed #9ca3af; display:flex; align-items:center; justify-content:center; color:#6b7280;"></div>',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: '150px',
                height: '150px',
                backgroundColor: '#e5e7eb',
                display: 'block'
            },
            behaviors: []
        });
    } else {
        // Default generic fallback
        newElements.push({
            id,
            type: 'box',
            name: 'Box',
            content: '<div style="width:100%; height:100%; background-color:#e5e7eb; border-radius:8px; border:2px dashed #9ca3af; display:flex; align-items:center; justify-content:center; color:#6b7280; font-weight:500;">Box</div>',
            style: {
                position: 'absolute',
                top: `${dropY}px`,
                left: `${dropX}px`,
                width: '150px',
                height: '150px',
                display: 'block'
            },
            behaviors: []
        });
    }

    return newElements;
};
