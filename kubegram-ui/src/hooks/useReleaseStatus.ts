import { useState, useEffect } from 'react';

/**
 * Mock API hook to check if the product is released.
 * @returns boolean - true if released, false if pre-release
 */
export const useReleaseStatus = () => {
    const [isReleased, setIsReleased] = useState<boolean>(false); // Default to false for demo
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Simulate API call
        const checkReleaseStatus = async () => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Toggle this to test different states
            const mockStatus = false;

            setIsReleased(mockStatus);
            setIsLoading(false);
        };

        checkReleaseStatus();
    }, []);

    return { isReleased, isLoading };
};
