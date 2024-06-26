import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import '../style/voteDetail.css';

export default function VoteDetail() {
    let { voteId } = useParams();
    let navigate = useNavigate();
    const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
    const [voteDetails, setVoteDetails] = useState(null);
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVoteDetails = async () => {
            const accessToken = await getAccessTokenSilently();
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/votes/${voteId}`, {
                    method: 'GET',
                    headers: {
                    'Authorization': `Bearer ${accessToken}`, 
                    },
                });
                if (!response.ok) {
                    throw new Error(`HTTP status ${response.status}`);
                }
                const data = await response.json();
                setVoteDetails(data);
                await fetchNews(data.candidateName, data.candidateType);
            } catch (err) {
                setError(`Failed to fetch vote details: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
    
        fetchVoteDetails();
      }, [voteId]);

      const fetchNews = async (candidateName, candidateType) => {
        try {
          const query = encodeURIComponent(`${candidateType} ${candidateName}`);
          const url = `https://api.webz.io/newsApiLite?token=f51d5e4a-1d00-4f9f-a031-ca0d49890d24&q=${query}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to fetch news');
          }
          const news = await response.json();
          setNewsData(news.posts);
        } catch (error) {
          console.error('Error fetching news:', error.message);
        }
      };

    const goBack = () => {
        navigate('/app/my-votes'); 
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const handleArticleClick = (url) => {
      window.open(url, '_blank');
    };

    return (
      <div className="container">
            <div className="header">
                <h1>Vote Details for vote ID: {voteId}</h1>
            </div>
            <div className="details">
                <p><strong>Voter Name:</strong> {voteDetails.userName}</p>
                <p><strong>Candidate Name:</strong> {voteDetails.candidateName}</p>
                <p><strong>Candidate Type:</strong> {voteDetails.candidateType}</p>
                <p><strong>Date Cast:</strong> {new Date(voteDetails.createdAt).toLocaleString()}</p>
            </div>
            <div className="news-container">
                {newsData.length ? newsData.map((article, index) => (
                <div key={index} className="news-article" onClick={() => handleArticleClick(article.thread.url)} style={{cursor: 'pointer'}}>
                    <h3>{article.thread.title}</h3>
                    <p>{new Date(article.published).toLocaleDateString()} by {article.author || 'Unknown'}</p>
                </div>
                )) : <p>No related news articles found.</p>}
            </div>
            <button className="return-to-myvotes-button" onClick={goBack}>Back to My Votes</button>
        </div>
    );
}